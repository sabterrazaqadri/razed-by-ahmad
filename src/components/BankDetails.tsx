import { BANK_ACCOUNT, BANK_TRANSFER_NOTE } from "@/content/payment";

/** Bank Al Habib account for customers who want to pay online. */
export function BankDetails({ note = true }: { note?: boolean }) {
  return (
    <div className="bank" data-testid="bank-details">
      {note && <p>{BANK_TRANSFER_NOTE}</p>}
      <dl>
        <div>
          <dt>Bank</dt>
          <dd>{BANK_ACCOUNT.bank}</dd>
        </div>
        <div>
          <dt>Account name</dt>
          <dd>{BANK_ACCOUNT.name}</dd>
        </div>
        <div>
          <dt>Account number</dt>
          <dd className="bank-num">{BANK_ACCOUNT.number}</dd>
        </div>
      </dl>
    </div>
  );
}
