import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { TransactionType } from "src/shared/enums/transaction";
import { CompactCategoryResponse } from "../category/category.dto";
import { CompactWalletResponse } from "../wallet/wallet.dto";
import { Expose, Type } from "class-transformer";
import { CompactRelatedUserResponse } from "../related-user/related-user.dto";
import { DateType } from "src/shared/types/base";

export class CreateGeneralTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}

export class CreateBulkIncomeTransactionRequest {
  @ApiProperty({
    type: [CreateGeneralTransactionRequest]
  })
  @Type(() => CreateGeneralTransactionRequest)
  @IsNotEmpty()
  @IsArray()
  transactions: CreateGeneralTransactionRequest[];
}

@Expose()
export class GeneralTransactionResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  type: TransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  categoryId: number;

  @ApiProperty({
    type: CompactCategoryResponse
  })
  @Type(() => CompactCategoryResponse)
  category: any;

  @ApiProperty()
  description: string;

  @ApiProperty()
  transactionDate: string;

  @ApiProperty()
  sourceWalletId: number;

  @ApiProperty({
    type: CompactWalletResponse
  })
  @Type(() => CompactWalletResponse)
  sourceWallet: any;

  @ApiProperty()
  notAddToReport: boolean;

  @ApiProperty()
  image?: string;

  constructor(partial: Partial<GeneralTransactionResponse>) {
    Object.assign(this, partial);
  }
}

export class CreateTransferTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  destinationWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}

@Expose()
export class TransferTransactionResponse extends GeneralTransactionResponse {
  @ApiProperty()
  extraInfo: any;

  constructor(partial: Partial<TransferTransactionResponse>) {
    super(partial);
  }
}

export class CreateLendTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  borrowerId: number;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  collectionDate?: string;

  //TODO: review this
  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}


@Expose()
export class LendTransactionResponse extends GeneralTransactionResponse {
  @ApiProperty()
  exraInfo: any;

  constructor(partial: Partial<TransferTransactionResponse>) {
    super(partial);
  }
}

export class CreateBorrowTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lenderId: number;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  repaymentDate?: string;

  //TODO: review this
  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}

@Expose()
export class BorrowTransactionResponse extends GeneralTransactionResponse {
  @ApiProperty()
  extraInfo: any;

  constructor(partial: Partial<TransferTransactionResponse>) {
    super(partial);
  }
}

export class GetAllTransactionsRequest {
  @ApiProperty({
    required: true,
    example: '2024-11-02T16:01:16.425Z'
  })
  @IsString()
  @IsISO8601({strict: true})
  @IsNotEmpty()
  from: string;

  @ApiProperty({
      required: true,
      example: '2024-11-02T16:01:16.425Z'
  })
  @IsNotEmpty()
  @IsISO8601({strict: true})
  @IsString()
  to: string;
}

export class UpdateIncomeTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateExpenseTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateLendTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty({
    required: false
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  borrowerId: number;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  collectionDate?: string;

  //TODO: review this
  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateBorrowTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lenderId: number;

  @ApiProperty({
    required: false,
    example: '2025-05-23T10:13:35.494Z'
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  repaymentDate?: string;

  //TODO: review this
  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  image?: string;
}

@Expose()
export class LendExtraInfoResponse {
  @ApiProperty()
  borrowerId: number;

  @ApiProperty()
  collectionDate?: string;

  @ApiProperty()
  collectedAmount: number;

  constructor(partial: Partial<LendExtraInfoResponse>) {
    Object.assign(this, partial);
  }
}

@Expose()
export class BorrowExtraInfoResponse {
  @ApiProperty()
  lenderId: number;

  @ApiProperty()
  repaymentDate?: string;

  @ApiProperty()
  repaymentAmount: number;

  constructor(partial: Partial<BorrowExtraInfoResponse>) {
    Object.assign(this, partial);
  }
}

@Expose()
export class TransferExtraInfoResponse {
  @ApiProperty()
  destinationWalletId: number;

  constructor(partial: Partial<TransferExtraInfoResponse>) {
    Object.assign(this, partial);
  }
}

@Expose()
export class FullInfoTransactionResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  type: TransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  categoryId: number;

  @ApiProperty({
    type: CompactCategoryResponse
  })
  @Type(() => CompactCategoryResponse)
  category: any;

  @ApiProperty()
  description: string;

  @ApiProperty()
  transactionDate: string;

  @ApiProperty()
  sourceWalletId: number;

  @ApiProperty({
    type: CompactWalletResponse
  })
  @Type(() => CompactWalletResponse)
  sourceWallet: any;

  @ApiProperty()
  notAddToReport: boolean;

  @ApiProperty()
  image?: string;

  @ApiProperty({
    description: 'Extra information based on transaction type',
    required: false
  })
  extraInfo?: LendExtraInfoResponse | BorrowExtraInfoResponse | TransferExtraInfoResponse;

  constructor(partial: Partial<FullInfoTransactionResponse>) {
    Object.assign(this, partial);
  }
}