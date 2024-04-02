'use client'
import { editTransactionAction } from "@/app/actions/editTransactionAction";
import { useFormState } from "react-dom"
import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"
import { Button } from "../ui/button"
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react";

const updateTransactionErrors = {
  _errors: [],
  categories: { _errors: [] },
  include: { _errors: [] },
  notInclude: { _errors: [] },
  biggerThan: { _errors: [] },
  smallerThan: { _errors: [] },
  rule: { _errors: [] },
}

const initialState = {
  message: '',
  errors: updateTransactionErrors,
  dbError: '',
}

const formInputClass = "dark:bg-white bg-white dark:border-border-light border-border-light dark:ring-offset-[#8f96bd] ring-offset-[#8f96bd]";

function FormError({ error }: { error: string }) {
  return (
    <div className="text-red-800 flex items-center"><AlertTriangle /><p className="ml-2">Error: {error}</p></div>
  )
}

function SubmitButton({ disabled = false, title }: { disabled?: boolean, title: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="default" aria-disabled={pending} disabled={disabled || pending}>
      {pending ? <>Saving...<Loader2 className="ml-2 h-4 w-4 animate-spin" /></> : title}
    </Button>
  )
}

export default function EditTransactionForm({ transaction, categories, selectedCategory, connectionId }: { transaction: any, categories: any, selectedCategory: string, connectionId: string }) {
  const transactionId = transaction.id;
  const accountId = transaction.account_id;
  const isPositive = transaction.amount > 0;
  const transactionType = transaction.transaction_type;
  const amount = transaction.amount;
  const transactionInfo = transaction.transaction_info;
  const editTransactionAndAddRule = editTransactionAction.bind(null, transactionId, selectedCategory, categories, accountId, isPositive, connectionId, transactionType);
  const [state, formAction] = useFormState(editTransactionAndAddRule, initialState);
  const [addRule, setAddRule] = useState(false);

  return (
    <form action={formAction}>

      <div className={'form-item'}>
        <Label htmlFor={'categories'}>Select the category that fits better</Label>
        <Select defaultValue={selectedCategory} name="categories">
          <SelectTrigger className="w-[600px]">
            <SelectValue placeholder="Choose another category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category: any) =>
              <SelectItem key={category.id} value={category.category_name}>{category.category_name}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className={'form-item w-[600px]'}>
        <Label htmlFor={'amount'}>Transaction type</Label>
        <Input className={formInputClass} type="text" autoComplete="off" placeholder={''} id={'amount'} name={'amount'} defaultValue={amount} readOnly={true} />
      </div>

      <div className={'form-item w-[600px]'}>
        <Label htmlFor={'transactionType'}>Transaction type</Label>
        <Input className={formInputClass} type="text" autoComplete="off" placeholder={''} id={'transactionType'} name={'transactionType'} defaultValue={transactionType} readOnly={true} />
      </div>

      <div className={'form-item w-[600px]'}>
        <Label htmlFor={'transactionInfo'}>Transaction info</Label>
        <Textarea className={formInputClass} autoComplete="off" placeholder={''} id={'transactionInfo'} name={'transactionInfo'} defaultValue={transactionInfo} readOnly={true} />
      </div>

      <div className={'w-[600px] mb-5 flex items-center'}>
        <Checkbox id="terms" name="rule" checked={addRule} onCheckedChange={(value: boolean) => setAddRule(value)} />
        <label htmlFor={'rule'} className="ml-2">Add rule?</label>
      </div>

      {
        addRule &&
        <>
          <div className={'form-item w-[600px]'}>
            <Label htmlFor={'include'}>What should include?</Label>
            <Textarea className={formInputClass} autoComplete="off" placeholder={''} id={'include'} name={'include'} defaultValue={''} />
          </div>
          <div className={'form-item w-[600px]'}>
            <Label htmlFor={'notInclude'}>What should <b>NOT</b> include?</Label>
            <Textarea className={formInputClass} autoComplete="off" placeholder={''} id={'notInclude'} name={'notInclude'} defaultValue={''} />
          </div>
          <div className={'form-item w-[600px]'}>
            <Label htmlFor={'biggerThan'}>Should be bigger than</Label>
            <Input type="number" className={formInputClass} autoComplete="off" placeholder={''} id={'biggerThan'} name={'biggerThan'} />
          </div>
          <div className={'form-item w-[600px]'}>
            <Label htmlFor={'smallerThan'}>Should be smaller than</Label>
            <Input type="number" className={formInputClass} autoComplete="off" placeholder={''} id={'smallerThan'} name={'smallerThan'} />
          </div>
        </>
      }

      <div className="flex items-center">
        <SubmitButton title={'Update transaction'} />
        {state?.dbError.length > 0 && <div className="ml-4"><FormError error={state.dbError} /></div>}
      </div>

      {
        state?.message && state?.message.length > 0
        && <p aria-live="polite" className="sr-only" role="status">{state?.message}</p>
      }

    </form>
  )
}