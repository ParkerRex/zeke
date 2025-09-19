"use client";

import Image from "next/image";
import appIcon from "public/appicon.png";
import { useEffect, useRef } from "react";

interface CheckoutSuccessDesktopProps {
	redirectPath: string;
}

export function CheckoutSuccessDesktop({
	redirectPath,
}: CheckoutSuccessDesktopProps) {
	const hasRunned = useRef(false);

	useEffect(() => {
		if (redirectPath && !hasRunned.current) {
			window.location.replace(`zeke://${redirectPath}`);
			hasRunned.current = true;
		}
	}, [redirectPath]);

	return (
		<div>
			<div className="h-screen flex flex-col items-center justify-center text-center text-sm text-[#606060]">
				<Image
					src={appIcon}
					width={80}
					height={80}
					alt="Zeke"
					quality={100}
					className="mb-10"
				/>
				<p>Checkout successful</p>
				<p className="mb-4">
					If Zeke dosen't open in a few seconds,{" "}
					<a className="underline" href={`zeke://${redirectPath}`}>
						click here
					</a>
					.
				</p>
				<p>You may close this browser tab when done</p>
			</div>
		</div>
	);
}
