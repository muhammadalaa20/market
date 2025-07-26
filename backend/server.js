const express = require('express');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'supersecretkey';

app.use(cors());
app.use(express.json());

const USERS_FILE = './users.json';
const PRODUCTS_FILE = './products.json';
const ORDERS_FILE = './orders.json';

// Read JSON 
function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// Write JSON
function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({
        error: 'Missing token'
    });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({
            error: 'Invalid token'
        });
        req.user = user;
        next();
    });
}

// Calculate total
function calculateTotal(items) {
    const products = readJSON(PRODUCTS_FILE);
    let total = 0;

    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const quantity = item.quantity || 1;
        const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
        total += discountedPrice * quantity;
    }

    return parseFloat(total.toFixed(2));
}

// Get all products
app.get('/products', (req, res) => {
    const products = readJSON(PRODUCTS_FILE);
    res.json(products);
});

// Get products by user
app.get('/products/by-user/:userId', authenticate, (req, res) => {
    const products = readJSON(PRODUCTS_FILE);
    const userProducts = products.filter(p => p.creatorId === req.params.userId);
    res.json(userProducts);
});


// Create product (authenticated)
app.post('/products', authenticate, (req, res) => {
    const products = readJSON(PRODUCTS_FILE);
    const newProduct = {
        id: Date.now(),
        name: req.body.name,
        price: req.body.price,
        category: req.body.category || 'General',
        description: req.body.description || '',
        brand: req.body.brand || '',
        stock: req.body.stock || 0,
        image: req.body.image || [],
        rating: req.body.rating || 0,
        reviews: req.body.reviews || [],
        tags: req.body.tags || [],
        discount: req.body.discount || 0,
        isFeatured: req.body.isFeatured || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleteRequested: false,
        createdBy: req.user.id
    };
    products.push(newProduct);
    writeJSON(PRODUCTS_FILE, products);
    res.status(201).json(newProduct);
});

// Update product with all fields and updatedAt
app.put('/products/:id', authenticate, (req, res) => {
    const products = readJSON(PRODUCTS_FILE);
    const index = products.findIndex(p => p.id == req.params.id);
    if (index === -1) return res.status(404).json({
        error: 'Product not found'
    });

    if (req.user.role !== 'admin' && product.creatorId !== req.user.id) {
        return res.status(403).json({
            error: 'Forbidden. You do not own this product.'
        });
    }

    const product = products[index];
    const updatedProduct = {
        ...product,
        ...req.body,
        updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;
    writeJSON(PRODUCTS_FILE, products);
    res.json(updatedProduct);
});


// Delete product
app.delete('/products/:id', authenticate, (req, res) => {
    let products = readJSON(PRODUCTS_FILE);
    const exists = products.find(p => p.id == req.params.id);
    if (!exists) return res.status(404).json({
        error: 'Product not found'
    });

    products = products.filter(p => p.id != req.params.id);
    writeJSON(PRODUCTS_FILE, products);
    res.json({
        message: 'Deleted successfully'
    });
});

// Request deletion (sets flag only)
app.post('/products/:id/request-delete', authenticate, (req, res) => {
    const products = readJSON(PRODUCTS_FILE);
    const index = products.findIndex(p => p.id == req.params.id);
    if (index === -1) return res.status(404).json({
        error: 'Product not found'
    });

    products[index].deleteRequested = true;
    writeJSON(PRODUCTS_FILE, products);
    res.json({
        message: 'Deletion requested'
    });
});

// Get all products with deleteRequested = true
app.get('/products/requested-deletion', authenticate, (req, res) => {
    const products = readJSON(PRODUCTS_FILE);
    const requested = products.filter(p => p.deleteRequested === true);
    res.json(requested);
});


// Register new user
app.post('/register', (req, res) => {
    const {
        username,
        email,
        password,
        role
    } = req.body;

    if (!username || !email || !password || !role)
        return res.status(400).json({
            error: 'All fields are required.'
        });

    const users = readJSON(USERS_FILE);
    const existing = users.find(u => u.email === email);
    if (existing) return res.status(409).json({
        error: 'Email already registered.'
    });

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
        id: Date.now(),
        username,
        email,
        password: hashedPassword,
        role,
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    // Return token after registration
    const token = jwt.sign({
        id: newUser.id,
        role: 'user',
        email,
        role
    }, SECRET_KEY, {
        expiresIn: '7d'
    });
    res.status(201).json({
        message: 'User registered.',
        token
    });
});


// User login
app.post('/login', (req, res) => {
    const {
        email,
        password
    } = req.body;
    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({
        error: 'Invalid credentials'
    });

    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({
            error: 'Wrong password'
        });
    }

    const token = jwt.sign({
        id: user.id,
        role: user.role,
        email: user.email
    }, SECRET_KEY, {
        expiresIn: '7d'
    });
    res.json({
        token
    });
});

// Get all users (admin-only)
app.get('/users', authenticate, (req, res) => {
    const users = readJSON(USERS_FILE).map(u => {
        const {
            password,
            ...rest
        } = u;
        return rest;
    });
    res.json(users);
});


// Checkout endpoint
app.post('/cart/checkout', authenticate, (req, res) => {
    const {
        items
    } = req.body;
    if (!Array.isArray(items) || items.length === 0)
        return res.status(400).json({
            error: 'Cart is empty.'
        });

    try {
        const total = calculateTotal(items);
        const orders = readJSON(ORDERS_FILE);

        const newOrder = {
            id: Date.now(),
            userId: req.user.id,
            items,
            total,
            timestamp: new Date().toISOString()
        };

        orders.push(newOrder);
        writeJSON(ORDERS_FILE, orders);

        res.status(201).json({
            message: 'Order placed successfully.',
            order: newOrder
        });
    } catch (err) {
        res.status(400).json({
            error: err.message
        });
    }
});

// Get all orders for a user
app.get('/orders/:userId', authenticate, (req, res) => {
    const orders = readJSON(ORDERS_FILE);
    const userId = parseInt(req.params.userId);

    if (req.user.id !== userId && req.user.role !== 'admin')
        return res.status(403).json({
            error: 'Access denied'
        });

    const userOrders = orders.filter(o => o.userId === userId);
    res.json(userOrders);
});


app.listen(PORT, () => {
    console.log(`Store backend running at http://localhost:${PORT}`);
});