import { CaretSortIcon } from "@radix-ui/react-icons";
import { authClient } from "@zeke/auth/client";
import { Button } from "@zeke/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@zeke/ui/collapsible";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@zeke/ui/input-otp";
import { Spinner } from "@zeke/ui/spinner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyInput } from "./copy-input";

export function EnrollMFA() {
  const router = useRouter();
  const [isValidating, setValidating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [qr, setQR] = useState<string | undefined>(undefined);
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const onComplete = async (code: string) => {
    setError(false);

    if (!isValidating) {
      setValidating(true);

      try {
        const result = await authClient.twoFactor.verifyTotp({
          code,
        });

        if (result.data) {
          setIsRedirecting(true);
          router.replace("/");
        } else {
          setError(true);
          setValidating(false);
        }
      } catch {
        setError(true);
        setValidating(false);
      }
    }
  };

  useEffect(() => {
    async function enroll() {
      try {
        const result = await authClient.twoFactor.enable({
          issuer: "app.zekehq.com",
        });

        if (!result.data) {
          setError(true);
          return;
        }

        setQR(result.data.totpURI);
        setSecret(result.data.secret);
      } catch {
        setError(true);
      }
    }

    enroll();
  }, []);

  const handleOnCancel = () => {
    authClient.twoFactor.disable().catch(() => {
      // Ignore errors when canceling
    });
    router.push("/");
  };

  return (
    <>
      <div className="flex items-center justify-center">
        <div className="w-[220px] h-[220px] bg-white rounded-md">
          {qr && (
            <Image src={qr} alt="qr" width={220} height={220} quality={100} />
          )}
        </div>
      </div>
      <div className="my-8">
        <p className="font-medium pb-1 text-2xl text-[#606060]">
          Use an authenticator app to scan the following QR code, and provide
          the code to complete the setup.
        </p>
      </div>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full mb-4"
      >
        <CollapsibleTrigger className="p-0 text-sm w-full">
          <div className="flex items-center justify-between">
            <span className="font-medium">Use setup key</span>
            <CaretSortIcon className="h-4 w-4" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {secret && <CopyInput value={secret} className="w-full" />}
        </CollapsibleContent>
      </Collapsible>

      <div className="flex w-full">
        <div className="w-full h-16 flex items-center justify-center">
          {isValidating || isRedirecting ? (
            <div className="flex items-center justify-center h-full bg-background/95 border border-input w-full">
              <div className="flex items-center space-x-2 bg-background px-4 py-2 rounded-md shadow-sm">
                <Spinner size={16} className="text-primary" />
                <span className="text-sm text-foreground font-medium">
                  {isRedirecting ? "Redirecting..." : "Setting up..."}
                </span>
              </div>
            </div>
          ) : (
            <InputOTP
              className={error ? "invalid" : ""}
              maxLength={6}
              autoFocus
              onComplete={onComplete}
              disabled={isValidating || isRedirecting}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index.toString()} {...slot} />
                  ))}
                </InputOTPGroup>
              )}
            />
          )}
        </div>
      </div>

      <div className="flex border-t-[1px] pt-4 mt-6 justify-center mb-6">
        <Button
          onClick={handleOnCancel}
          variant="ghost"
          className="text-medium text-sm hover:bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </>
  );
}
