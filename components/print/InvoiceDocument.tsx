import { Box } from "@mui/material";

import { lineAmount } from "@/lib/billing";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Branch, Clinic, InvoiceWithRelations, Payment, PatientListItem } from "@/types";

import PrintableLayout, { KeyValueGrid, SignatureBlock, printStyles } from "./PrintableLayout";

interface Props {
  clinic: Clinic;
  branch?: Branch;
  invoice: InvoiceWithRelations;
  patient: PatientListItem;
}

export function InvoiceDocument({ clinic, branch, invoice, patient }: Props) {
  const cancelled = invoice.status === "Cancelled";
  return (
    <PrintableLayout
      clinic={clinic}
      title={cancelled ? "Invoice (Cancelled)" : "Tax Invoice"}
      subtitle={branch && !branch.isMain ? `${branch.name} branch · ${branch.address}` : undefined}
      meta={[
        ["Invoice No", invoice.id],
        ["Invoice Date", formatDate(invoice.invoiceDate)],
        ["Due Date", formatDate(invoice.dueDate)],
        ["Status", invoice.status],
      ]}
    >
      <h3>Billed to</h3>
      <KeyValueGrid
        items={[
          ["Patient", `${patient.name} (${patient.id})`],
          ["Mobile", patient.phone],
          ["Address", [patient.address.line, patient.address.city].filter(Boolean).join(", ")],
          ["Provider", invoice.provider.name],
        ]}
      />
      <Box component="table" sx={printStyles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th className="num">Qty</th>
            <th className="num">Rate</th>
            <th className="num">Tax</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.description}</td>
              <td className="num">{item.quantity}</td>
              <td className="num">{formatCurrency(item.unitPrice)}</td>
              <td className="num">{item.taxRate}%</td>
              <td className="num">{formatCurrency(lineAmount(item))}</td>
            </tr>
          ))}
        </tbody>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
        <Box component="table" sx={{ ...printStyles.table, width: 260 }}>
          <tbody>
            <tr><td>Subtotal</td><td className="num">{formatCurrency(invoice.subtotal)}</td></tr>
            {invoice.discount > 0 && <tr><td>Discount</td><td className="num">− {formatCurrency(invoice.discount)}</td></tr>}
            {invoice.tax > 0 && <tr><td>Tax</td><td className="num">{formatCurrency(invoice.tax)}</td></tr>}
            <tr><td><strong>Total</strong></td><td className="num"><strong>{formatCurrency(invoice.total)}</strong></td></tr>
            <tr><td>Paid</td><td className="num">{formatCurrency(invoice.paid)}</td></tr>
            {invoice.refunded > 0 && <tr><td>Refunded</td><td className="num">{formatCurrency(invoice.refunded)}</td></tr>}
            <tr><td><strong>Balance due</strong></td><td className="num"><strong>{formatCurrency(cancelled ? 0 : invoice.balance)}</strong></td></tr>
          </tbody>
        </Box>
      </Box>
      {invoice.payments.length > 0 && (
        <>
          <h3>Payment information</h3>
          <Box component="table" sx={printStyles.table}>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.receiptNumber}</td>
                  <td>{formatDate(payment.date)}</td>
                  <td>{payment.kind === "refund" ? `Refund (${payment.method})` : payment.method}</td>
                  <td>{payment.reference || "—"}</td>
                  <td className="num">{payment.kind === "refund" ? "− " : ""}{formatCurrency(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </Box>
        </>
      )}
      {invoice.notes && (
        <>
          <h3>Notes</h3>
          <Box sx={{ fontSize: 11 }}>{invoice.notes}</Box>
        </>
      )}
      {clinic.billingSettings.termsAndConditions && (
        <>
          <h3>Terms & conditions</h3>
          <Box sx={{ fontSize: 10, color: "#64748B" }}>{clinic.billingSettings.termsAndConditions}</Box>
        </>
      )}
      <SignatureBlock name={`For ${clinic.name}`} label={clinic.branding.signatureLabel} />
    </PrintableLayout>
  );
}

export function ReceiptDocument({ clinic, invoice, patient, payment }: Props & { payment: Payment }) {
  const refund = payment.kind === "refund";
  return (
    <PrintableLayout
      clinic={clinic}
      title={refund ? "Refund Note" : "Payment Receipt"}
      meta={[
        [refund ? "Credit Note" : "Receipt No", payment.receiptNumber],
        ["Date", formatDate(payment.date)],
        ["Invoice", invoice.id],
      ]}
    >
      <KeyValueGrid
        items={[
          [refund ? "Refunded to" : "Received from", `${patient.name} (${patient.id})`],
          ["Mobile", patient.phone],
          ["Amount", formatCurrency(payment.amount)],
          ["Payment method", payment.method],
          ["Reference", payment.reference || "—"],
          ["Towards invoice", `${invoice.id} dated ${formatDate(invoice.invoiceDate)}`],
        ]}
      />
      <Box component="table" sx={printStyles.table}>
        <thead>
          <tr>
            <th className="num">Invoice total</th>
            <th className="num">Total paid</th>
            <th className="num">Balance due</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="num">{formatCurrency(invoice.total)}</td>
            <td className="num">{formatCurrency(invoice.paid)}</td>
            <td className="num">{formatCurrency(invoice.balance)}</td>
          </tr>
        </tbody>
      </Box>
      {payment.note && <Box sx={{ fontSize: 11, mt: 1.5 }}>Note: {payment.note}</Box>}
      <SignatureBlock name={`For ${clinic.name}`} label={clinic.branding.signatureLabel} />
    </PrintableLayout>
  );
}
