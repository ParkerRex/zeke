"use client";

import { useConnectParams } from "@/hooks/use-connect-params";
import { Button } from "@zeke/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@zeke/ui/dialog";
import { Input } from "@zeke/ui/input";
import { Skeleton } from "@zeke/ui/skeleton";
import { useRouter } from "next/navigation";

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from(new Array(10), (_, index) => (
        <div className="flex items-center space-x-4" key={index.toString()}>
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-2 rounded-none w-[140px]" />
            <Skeleton className="h-2 rounded-none w-[40px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatProvider(provider: string) {
  switch (provider) {
    case "enablebanking":
      return "Enable Banking";
    case "gocardless":
      return "GoCardLess";
    case "teller":
      return "Teller";
  }
}

type SearchResultProps = {
  id: string;
  name: string;
  logo: string | null;
  provider: string;
  availableHistory: number;
  maximumConsentValidity: number;
  type?: "personal" | "business";
};

function SearchResult({
  id,
  name,
  logo,
  provider,
  availableHistory,
  maximumConsentValidity,
  type,
}: SearchResultProps) {
  return (
    <div className="flex justify-between">
      <div className="flex items-center">
        <div className="space-y-1 cursor-default">
          <p className="text-sm font-medium leading-none">{name}</p>
          <span className="text-[#878787] text-xs capitalize">
            Via {formatProvider(provider)}
            {type ? ` • ${type}` : ""}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Stubbed - no actual connection logic
          console.log(`Connecting to ${name} via ${provider}`);
        }}
      >
        Connect
      </Button>
    </div>
  );
}

type ConnectTransactionsModalProps = {
  countryCode: string;
};

export function ConnectTransactionsModal({
  countryCode: initialCountryCode,
}: ConnectTransactionsModalProps) {
  const router = useRouter();
  const {
    countryCode,
    search: query,
    step,
    setParams,
  } = useConnectParams(initialCountryCode);

  const isOpen = step === "connect";

  const handleOnClose = () => {
    setParams({
      step: null,
      countryCode: null,
      search: null,
      ref: null,
    });
  };

  // Mock data for UI demonstration
  const mockInstitutions = [
    {
      id: "1",
      name: "Chase Bank",
      logo: null,
      provider: "teller",
      availableHistory: 90,
      maximumConsentValidity: 180,
      type: "personal" as const,
    },
    {
      id: "2",
      name: "Bank of America",
      logo: null,
      provider: "gocardless",
      availableHistory: 90,
      maximumConsentValidity: 90,
      type: "business" as const,
    },
    {
      id: "3",
      name: "Wells Fargo",
      logo: null,
      provider: "enablebanking",
      availableHistory: 365,
      maximumConsentValidity: 180,
    },
  ];

  const filteredInstitutions = query
    ? mockInstitutions.filter((institution) =>
        institution.name.toLowerCase().includes(query.toLowerCase()),
      )
    : mockInstitutions;

  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect bank account</DialogTitle>

            <DialogDescription>
              We work with a variety of banking providers to support as many
              banks as possible. If you can't find yours,{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setParams({ step: "import" })}
              >
                manual import
              </button>{" "}
              is available as an alternative.
            </DialogDescription>

            <div className="pt-4">
              <div className="flex space-x-2 relative">
                <Input
                  placeholder="Search bank..."
                  type="search"
                  onChange={(evt) =>
                    setParams({ search: evt.target.value || null })
                  }
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoFocus
                  value={query ?? ""}
                />
              </div>

              <div className="h-[430px] space-y-4 overflow-auto scrollbar-hide pt-2 mt-2">
                {filteredInstitutions.map((institution) => (
                  <SearchResult
                    key={institution.id}
                    id={institution.id}
                    name={institution.name}
                    logo={institution.logo}
                    provider={institution.provider}
                    availableHistory={institution.availableHistory}
                    maximumConsentValidity={institution.maximumConsentValidity}
                    type={institution.type}
                  />
                ))}

                {filteredInstitutions.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[350px]">
                    <p className="font-medium mb-2">No banks found</p>
                    <p className="text-sm text-center text-[#878787]">
                      We couldn't find a bank matching your criteria.
                      <br /> Let us know, or start with manual import.
                    </p>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setParams({ step: "import" })}
                      >
                        Import
                      </Button>

                      <Button
                        onClick={() => {
                          router.push("/account/support");
                        }}
                      >
                        Contact us
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
}
