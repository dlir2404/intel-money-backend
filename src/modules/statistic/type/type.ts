export type StatisticType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type StatisticThisTime = 'today' | 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'thisYear';

export type CategoryStatisticData = {
    id: number;
    amount: string;
}

export type WalletStatisticData = {
    id: number;
    amount: string;
}

export type StatisticData = {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;

    byCategoryIncome: CategoryStatisticData[];
    byCategoryExpense: CategoryStatisticData[]
};
  

export type GroupedStatisticData = {
    [key in StatisticThisTime]: StatisticData;
}