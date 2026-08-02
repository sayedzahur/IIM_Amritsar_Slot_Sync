export default function BackLink({ href = "/", label = "Back to Home" }) {
  return (
    <a href={href} className="back-link">
      <span aria-hidden="true">&larr;</span> {label}
    </a>
  );
}
