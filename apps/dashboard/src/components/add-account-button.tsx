"use client";
// TODO: update for add-source
import { Button } from "@zeke/ui/button";
import { useQueryState } from "nuqs";

export function AddAccountButton({ onClick }: { onClick?: () => void }) {
  const [_, setStep] = useQueryState("step");

  const handleClick = () => {
    setStep("connect");
    onClick?.();
  };

  return (
    <Button
      data-event="Add account"
      data-icon="🏦"
      data-channel="bank"
      onClick={handleClick}
    >
      Add account
    </Button>
  );
}
