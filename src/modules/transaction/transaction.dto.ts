import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { TransactionType } from "src/shared/enums/transaction";
import { CompactCategoryResponse } from "../category/category.dto";
import { CompactWalletResponse } from "../wallet/wallet.dto";
import { Expose, Type } from "class-transformer";
import { CompactRelatedUserResponse } from "../related-user/related-user.dto";

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
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    required: false
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
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
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
  images: string[];

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
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    required: false
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
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@Expose()
export class TransferTransactionResponse extends GeneralTransactionResponse {
  @ApiProperty()
  destinationWalletId: number;

  @ApiProperty({
    type: CompactWalletResponse
  })
  @Type(() => CompactWalletResponse)
  destinationWallet: any;

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
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  borowerId: number;

  @ApiProperty({
    required: false
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
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}


@Expose()
export class LendTransactionResponse extends GeneralTransactionResponse {
  @ApiProperty()
  collectionDate?: string;

  @ApiProperty()
  collectedAmount: number;

  @ApiProperty({
    type: CompactRelatedUserResponse
  })
  @Type(() => CompactRelatedUserResponse)
  borrower: any;

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
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lenderId: number;

  @ApiProperty({
    required: false
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
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@Expose()
export class BorrowTransactionResponse extends GeneralTransactionResponse {
  @ApiProperty()
  repaymentDate?: string;

  @ApiProperty()
  repaymentAmount: number;

  @ApiProperty({
    type: CompactRelatedUserResponse
  })
  @Type(() => CompactRelatedUserResponse)
  lender: any;

  constructor(partial: Partial<TransferTransactionResponse>) {
    super(partial);
  }
}