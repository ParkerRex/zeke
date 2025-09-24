// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import type { InvoiceFormValues } from "./form-context";

export const transformFormValuesToDraft = (values: InvoiceFormValues) => {
  return {
    ...values,
    template: {
      ...values.template,
      ...(values.paymentDetails && {
        paymentDetails: JSON.stringify(values.paymentDetails),
      }),
      ...(values.fromDetails && {
        fromDetails: JSON.stringify(values.fromDetails),
      }),
    },
    ...(values.paymentDetails && {
      paymentDetails: JSON.stringify(values.paymentDetails),
    }),
    ...(values.fromDetails && {
      fromDetails: JSON.stringify(values.fromDetails),
    }),
    ...(values.customerDetails && {
      customerDetails: JSON.stringify(values.customerDetails),
    }),
    ...(values.noteDetails && {
      noteDetails: JSON.stringify(values.noteDetails),
    }),
  };
};
