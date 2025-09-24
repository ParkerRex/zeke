// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { Icons } from "@zeke/ui/icons";

type Props = {
	firstName: string;
};

export function ChatEmpty({ firstName }: Props) {
	return (
		<div className="w-full mt-[200px] desktop:mt-24 md:mt-24 flex flex-col items-center justify-center text-center">
			<Icons.LogoSmall />
			<span className="font-medium text-xl mt-6">
				Hi {firstName}, how can I help <br />
				you today?
			</span>
		</div>
	);
}
