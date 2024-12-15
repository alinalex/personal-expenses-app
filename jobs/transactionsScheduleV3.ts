import {logger, task, schedules} from "@trigger.dev/sdk/v3";
import {Supabase} from "@trigger.dev/supabase";

import { createClient } from "@supabase/supabase-js";

// const supabase = new Supabase({
//     id: "supabase",
//     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
// });

// const cookieStore = cookies()
const supabase = createClient(
    // These details can be found in your Supabase project settings under `API`
    process.env.NEXT_PUBLIC_SUPABASE_URL as string, // e.g. https://abc123.supabase.co - replace 'abc123' with your project ID
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string // Your service role secret key
);

const errorResponse = {
    success: false,
    data: null,
};

export const transactionsSchedule = schedules.task({
    id: "transactions-schedule",
    cron: "0 2 * * *",
    run: async (payload, ctx) => {

        const { data: bankAccounts, error: bankAccountsError } = await supabase.from('bank_accounts').select(`*`).eq('isCron', true);

        if (bankAccountsError || (bankAccounts && bankAccounts.length === 0)) {
            logger.error('no bank accounts', { code: '400', message: bankAccountsError });
            return errorResponse;
        }

        //use `logger` instead of `io.logger`
        logger.info("Completed fetch successfully");
    },
});