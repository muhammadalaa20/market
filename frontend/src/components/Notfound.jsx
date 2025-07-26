import {Link} from 'react-router';

export default function NotFound() {
  return (
    // <NotFound /> component to display if the route is not found with the errorElement prop and a button to go back to the home page
    <div className="not-found">
      <img src="/not-found.svg" alt="404 Not Found" />
      <Link to="/" className='link'>Go back to home</Link>
    </div>
  );
}
