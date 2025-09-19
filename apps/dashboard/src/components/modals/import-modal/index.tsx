"use client";

import { importTransactionsAction } from "@/actions/transactions/import-transactions";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatedSizeContainer } from "@zeke/ui/animated-size-container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@zeke/ui/dialog";
import { Icons } from "@zeke/ui/icons";
import { SubmitButton } from "@zeke/ui/submit-button";
import { useToast } from "@zeke/ui/use-toast";
import { stripSpecialCharacters } from "@zeke/utils";
import { useAction } from "next-safe-action/hooks";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { ImportCsvContext, importSchema } from "./context";
import { FieldMapping } from "./field-mapping";
import { SelectFile } from "./select-file";

/** Available pages in the import modal flow */
const pages = ["select-file", "confirm-import"] as const;

/**
 * Props for the ImportModal component
 */
type Props = {
  /** Array of available currency codes */
  currencies: string[];
  /** Default currency to use for imports */
  defaultCurrency: string;
};

/**
 * Modal component for importing CSV transaction files.
 *
 * Provides a two-step flow:
 * 1. File selection and validation
 * 2. Field mapping confirmation and import execution
 *
 * The modal integrates with URL state management to maintain import state
 * and provides real-time feedback during the import process.
 *
 * @param currencies - Array of available currency codes for selection
 * @param defaultCurrency - Default currency to pre-select in the form
 */
export function ImportModal({ currencies, defaultCurrency }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  /** Unique identifier for the current import run */
  const [runId, setRunId] = useState<string | undefined>();

  /** Access token for tracking import progress */
  const [accessToken, setAccessToken] = useState<string | undefined>();

  /** Whether an import operation is currently in progress */
  const [isImporting, setIsImporting] = useState(false);

  /** Column headers extracted from the uploaded CSV file */
  const [fileColumns, setFileColumns] = useState<string[] | null>(null);

  /** Sample rows from the CSV file for preview */
  const [firstRows, setFirstRows] = useState<Record<string, string>[] | null>(
    null,
  );

  const { data: user } = useUserQuery();

  /** Current page index in the import flow */
  const [pageNumber, setPageNumber] = useState<number>(0);
  const page = pages[pageNumber];

  const { uploadFile } = useUpload();

  const { toast } = useToast();

  const { status, setStatus } = useSyncStatus({ runId, accessToken });

  /** URL query parameters for modal state management */
  const [params, setParams] = useQueryStates({
    step: parseAsString,
    accountId: parseAsString,
    type: parseAsString,
    hide: parseAsBoolean.withDefault(false),
  });

  /** Whether the modal should be open based on URL parameters */
  const isOpen = params.step === "import";

  /** Server action for importing transactions */
  const importTransactions = useAction(importTransactionsAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setRunId(data.id);
        setAccessToken(data.publicAccessToken);
      }
    },
    onError: () => {
      setIsImporting(false);
      setRunId(undefined);
      setStatus("FAILED");

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  /** Form management for import configuration */
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useZodForm(importSchema, {
    defaultValues: {
      currency: defaultCurrency,
      bank_account_id: params.accountId ?? undefined,
      inverted: params.type === "credit",
    },
  });

  const file = watch("file");

  /**
   * Closes the modal and resets all state
   */
  const onclose = () => {
    setFileColumns(null);
    setFirstRows(null);
    setPageNumber(0);
    reset();

    setParams({
      step: null,
      accountId: null,
      type: null,
      hide: null,
    });
  };

  // Set bank account ID from URL parameters
  useEffect(() => {
    if (params.accountId) {
      setValue("bank_account_id", params.accountId);
    }
  }, [params.accountId]);

  // Set inverted flag based on transaction type
  useEffect(() => {
    if (params.type) {
      setValue("inverted", params.type === "credit");
    }
  }, [params.type]);

  // Handle import failure status
  useEffect(() => {
    if (status === "FAILED") {
      setIsImporting(false);
      setRunId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again or contact support.",
      });
    }
  }, [status]);

  // Handle successful import completion
  useEffect(() => {
    if (status === "COMPLETED") {
      setRunId(undefined);
      setIsImporting(false);
      onclose();

      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.bankAccounts.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.bankConnections.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.reports.pathKey(),
      });

      toast({
        duration: 3500,
        variant: "success",
        title: "Transactions imported successfully.",
      });
    }
  }, [status]);

  // Auto-advance to field mapping page when file is ready
  useEffect(() => {
    if (file && fileColumns && pageNumber === 0) {
      setPageNumber(1);
    }
  }, [file, fileColumns, pageNumber]);

  return (
    <Dialog open={isOpen} onOpenChange={onclose}>
      <DialogContent>
        <div className="p-4 pb-0">
          <DialogHeader>
            <div className="flex space-x-4 items-center mb-4">
              {!params.hide && (
                <button
                  type="button"
                  className="items-center border bg-accent p-1"
                  onClick={() => setParams({ step: "connect" })}
                >
                  <Icons.ArrowBack />
                </button>
              )}
              <DialogTitle className="m-0 p-0">
                {page === "select-file" && "Select file"}
                {page === "confirm-import" && "Confirm import"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {page === "select-file" &&
                "Upload a CSV file of your transactions."}
              {page === "confirm-import" &&
                "We've mapped each column to what we believe is correct, but please review the data below to confirm it's accurate."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <AnimatedSizeContainer height>
              <ImportCsvContext.Provider
                value={{
                  fileColumns,
                  setFileColumns,
                  firstRows,
                  setFirstRows,
                  control,
                  watch,
                  setValue,
                }}
              >
                <div>
                  <form
                    className="flex flex-col gap-y-4"
                    onSubmit={handleSubmit(async (data) => {
                      setIsImporting(true);

                      const filename = stripSpecialCharacters(data.file.name);
                      const { path } = await uploadFile({
                        bucket: "vault",
                        path: [user?.team?.id ?? "", "imports", filename],
                        file,
                      });

                      importTransactions.execute({
                        filePath: path,
                        currency: data.currency,
                        bankAccountId: data.bank_account_id,
                        currentBalance: data.balance,
                        inverted: data.inverted,
                        mappings: {
                          amount: data.amount,
                          date: data.date,
                          description: data.description,
                        },
                      });
                    })}
                  >
                    {page === "select-file" && <SelectFile />}
                    {page === "confirm-import" && (
                      <>
                        <FieldMapping currencies={currencies} />

                        <SubmitButton
                          isSubmitting={isImporting}
                          disabled={!isValid}
                          className="mt-4"
                        >
                          Confirm import
                        </SubmitButton>

                        <button
                          type="button"
                          className="text-sm mb-4 text-[#878787]"
                          onClick={() => {
                            setPageNumber(0);
                            reset();
                            setFileColumns(null);
                            setFirstRows(null);
                          }}
                        >
                          Choose another file
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </ImportCsvContext.Provider>
            </AnimatedSizeContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
