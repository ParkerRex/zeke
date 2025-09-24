// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { exportTransactionsAction } from "@/actions/export-transactions-action";
import { useUserQuery } from "@/hooks/use-user";
import { useExportStore } from "@/store/export";
import { useTransactionsStore } from "@/store/transactions";
import NumberFlow from "@number-flow/react";
import { Button } from "@zeke/ui/button";
import { Icons } from "@zeke/ui/icons";
import { SubmitButton } from "@zeke/ui/submit-button";
import { useToast } from "@zeke/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

export function ExportBar() {
  const { toast } = useToast();
  const { setExportData } = useExportStore();
  const { rowSelection, setRowSelection } = useTransactionsStore();
  const [isOpen, setOpen] = useState(false);
  const { data: user } = useUserQuery();

  const ids = Object.keys(rowSelection);
  const totalSelected = ids.length;

  const { execute, status } = useAction(exportTransactionsAction, {
    onSuccess: ({ data }) => {
      if (data?.id && data?.publicAccessToken) {
        setExportData({
          runId: data.id,
          accessToken: data.publicAccessToken,
        });

        setRowSelection(() => ({}));
      }

      setOpen(false);
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  useEffect(() => {
    if (totalSelected) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [totalSelected]);

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed left-[50%] bottom-2 w-[400px] -ml-[200px] z-50"
        animate={{ y: isOpen ? 0 : 100 }}
        initial={{ y: 100 }}
      >
        <div className="mx-2 md:mx-0 backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C]">
          <span className="text-sm text-[#878787]">
            <NumberFlow value={Object.keys(rowSelection).length} /> selected
          </span>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => setRowSelection({})}>
              <span>Deselect all</span>
            </Button>
            <SubmitButton
              isSubmitting={status === "executing"}
              onClick={() =>
                execute({
                  transactionIds: ids,
                  dateFormat: user?.dateFormat ?? undefined,
                  locale: user?.locale ?? undefined,
                })
              }
            >
              <div className="flex items-center space-x-2">
                <span>Export</span>
                <Icons.ArrowCoolDown className="size-4" />
              </div>
            </SubmitButton>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
