// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import type { RouterOutputs } from "@api/trpc/routers/_app";
import { TransactionListItem } from "./transaction-list-item";

type Props = {
  transactions: NonNullable<RouterOutputs["transactions"]["get"]["data"]>;
  disabled: boolean;
};

export function TransactionsItemList({ transactions, disabled }: Props) {
  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-24">
      {transactions?.map((transaction) => {
        return (
          <li key={transaction.id}>
            <TransactionListItem
              transaction={transaction}
              disabled={disabled}
            />
          </li>
        );
      })}
    </ul>
  );
}
