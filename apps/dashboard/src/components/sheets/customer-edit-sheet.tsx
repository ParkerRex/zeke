"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@zeke/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zeke/ui/dropdown-menu";
import { Icons } from "@zeke/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@zeke/ui/sheet";
import { CustomerForm } from "../forms/customer-form";

export function CustomerEditSheet() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams, customerId } = useCustomerParams();

  const isOpen = Boolean(customerId);

  const { data: customer } = useQuery(
    trpc.customers.getById.queryOptions(
      { id: customerId! },
      {
        enabled: isOpen,
        staleTime: 0, // Always consider data stale so it always refetches
        initialData: () => {
          const pages = queryClient
            .getQueriesData({ queryKey: trpc.customers.get.infiniteQueryKey() })
            // @ts-expect-error
            .flatMap(([, data]) => data?.pages ?? [])
            .flatMap((page) => page.data ?? []);

          return pages.find((d) => d.id === customerId);
        },
      },
    ),
  );

  const deleteCustomerMutation = useMutation(
    trpc.customers.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.customers.get.infiniteQueryKey(),
        });
        setParams(null);
      },
    }),
  );

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Edit Customer</h2>

          {customerId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button">
                  <Icons.MoreVertical className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={10} align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the customer and remove their data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteCustomerMutation.mutate({ id: customerId })
                        }
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SheetHeader>

        <CustomerForm data={customer} key={customer?.id} />
      </SheetContent>
    </Sheet>
  );
}
