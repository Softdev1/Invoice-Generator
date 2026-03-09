import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Invoice Generator - Create Invoices Easily';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative grid dots */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.06,
            backgroundImage:
              'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Amber accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)',
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '88px',
            height: '88px',
            borderRadius: '20px',
            background: '#fbbf24',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.3)',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '56px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-1px',
            marginBottom: '16px',
          }}
        >
          Invoice Generator
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            color: '#94a3b8',
            fontWeight: 400,
          }}
        >
          Create professional invoices in seconds
        </div>

        {/* Bottom amber accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
            }}
          />
          <div
            style={{
              fontSize: '16px',
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            Simple invoicing for small businesses
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
