/**
 * Logo mark – uses the app icon SVG (logo-mark.svg) so it matches exactly.
 * Wrapper with overflow-hidden + rounded corners clips any sharp-edge artifacts when scaled.
 */
interface LogoMarkProps {
  className?: string;
  size?: number;
}

export function LogoMark({ className = '', size = 32 }: LogoMarkProps) {
  return (
    <span
      className={`inline-block overflow-hidden rounded-[18.75%] ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-mark.svg"
        alt=""
        width={size}
        height={size}
        className="block h-full w-full object-cover"
      />
    </span>
  );
}
