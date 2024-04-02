'use server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function editTransactionAction(transactionId: string, selectedCategory: string, categoriesDB: any[], accountId: number, isPositive: boolean, connectionId: string, transactionType: string, prevState: any, formData: FormData) {

  const categories = formData.get('categories');
  const include = formData.get('include');
  const notInclude = formData.get('notInclude');
  const biggerThan = formData.get('biggerThan');
  const smallerThan = formData.get('smallerThan');
  const rule = formData.get('rule');

  // console.log('categories', categories);
  // console.log('include', include);
  // console.log('notInclude', notInclude);
  // console.log('biggerThan', biggerThan);
  // console.log('smallerThan', smallerThan);
  // console.log('rule', rule);
  // console.log('ispositive', isPositive);

  if (typeof categories === undefined || categories === null) {
    return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'Categories cannot be empty' }
  }

  if (typeof categories === 'string' && categories.length > 0 && categories === selectedCategory) {
    return { message: 'Failed to update transaction', errors: prevState.errors, dbError: `You forgot to change the category. It is still ${selectedCategory} as in the beginning of this update.` }
  }

  const categoryId = categoriesDB.filter(elem => elem.category_name === categories)[0].id;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (typeof rule !== undefined && rule !== null) {
    // if ((include === '' && notInclude === '')) {
    //   return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'At least one between Should include and Should not include cannot be empty' }
    // }

    if (isPositive) {
      if (Number(smallerThan) !== 0 && Number(biggerThan) !== 0 && Number(smallerThan) < Number(biggerThan)) {
        return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'Bigger than value cannot be bigger than smaller than value' }
      }

      if (Number(smallerThan) !== 0 && biggerThan === '') {
        return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'Bigger than cannot be empty if smaller than has a value' }
      }
    } else {
      if (Number(smallerThan) !== 0 && Number(biggerThan) !== 0 && Number(smallerThan) < Number(biggerThan)) {
        return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'Bigger than value cannot be bigger than smaller than value' }
      }

      if (Number(biggerThan) !== 0 && smallerThan === '') {
        return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'Smaller than cannot be empty if bigger than has a value' }
      }

    }

    // check all transactions that fit the rule but does not have the correct caregory
    let checkAllTransactionsThatFitTheRuleQuery = supabase.from('account_transactions').select(`*, transaction_categories(category_name, id)`).eq('account_id', accountId);
    checkAllTransactionsThatFitTheRuleQuery.eq('transaction_type', transactionType);
    if ((include as string).length > 0) {
      checkAllTransactionsThatFitTheRuleQuery.ilike('transaction_info', `%${include as string}%`);
    }
    if ((notInclude as string).length > 0) {
      checkAllTransactionsThatFitTheRuleQuery.not('transaction_info', 'like', `%${notInclude as string}%`);
    }
    if (Number(biggerThan) !== 0) checkAllTransactionsThatFitTheRuleQuery.gt('amount', Number(biggerThan));
    if (Number(smallerThan) !== 0) checkAllTransactionsThatFitTheRuleQuery.lt('amount', Number(smallerThan));

    const { data: dataToUpdate, error: dataToUpdateError } = await checkAllTransactionsThatFitTheRuleQuery;
    console.log('dataToUpdate', dataToUpdate);

    if (!dataToUpdateError && dataToUpdate && dataToUpdate.length > 0) {
      const dataToUpsert = dataToUpdate.map(elem => ({ id: elem.id, category_id: categoryId }));
      const { data, error } = await supabase.from('account_transactions').upsert(dataToUpsert).select();
      console.log('data', data);
      console.log('error', error);
      if (error) return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'An error occured, please try again.' };

    } else {
      // update only this transaction category id
      const { data, error } = await supabase
        .from('account_transactions')
        .update({ category_id: categoryId })
        .eq('id', Number(transactionId))
        .select();

      console.log('update cu regula la un item', data);
      if (error) return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'An error occured, please try again.' };
    }

    // insert rule
    const { data, error } = await supabase
      .from('category_rules')
      .insert([
        { category_id: categoryId, is_positive: isPositive, transaction_type: transactionType, includes: typeof include === 'string' && include.length > 0 ? include : null, not_includes: typeof notInclude === 'string' && notInclude.length > 0 ? notInclude : null, bigger_than: typeof biggerThan === 'string' && biggerThan.length > 0 ? Number(biggerThan) : null, smaller_than: typeof smallerThan === 'string' && smallerThan.length > 0 ? Number(smallerThan) : null },
      ])
      .select();
    console.log('error', error);

    if (error) return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'An error occured, please try again.' };

  } else {
    // update only this transaction category id
    const { data, error } = await supabase
      .from('account_transactions')
      .update({ category_id: categoryId })
      .eq('id', Number(transactionId))
      .select()

    console.log('update fara regula la un item', data);
    if (error) return { message: 'Failed to update transaction', errors: prevState.errors, dbError: 'An error occured, please try again.' };
  }

  // return prevState;
  revalidatePath(`/dashboard/accounts/${connectionId}/${accountId}`);
  redirect(`/dashboard/accounts/${connectionId}/${accountId}`);
}