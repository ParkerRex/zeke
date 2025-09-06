import * as React from 'react';
import { Tailwind } from '@react-email/tailwind';

export default function WelcomeEmail() {
  return (
    <Tailwind config={{ theme: {} }}>
      <div className='p-6'>
        <h1 className='text-xl font-bold'>Welcome to ZEKE</h1>
        <p className='mt-2 text-sm text-gray-700'>We’re glad you’re here.</p>
      </div>
    </Tailwind>
  );
}

