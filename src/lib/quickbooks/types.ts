// QuickBooks OAuth Token Types
export interface QuickBooksTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  id_token?: string;
  realmId: string;
  createdAt: number; // timestamp
}

export interface QuickBooksAuthResponse {
  token: QuickBooksTokens;
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  body: string;
  json: any;
  intuit_tid: string;
}

// QuickBooks Customer Types
export interface QuickBooksCustomer {
  Id?: string;
  SyncToken?: string;
  DisplayName: string;
  Name?: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: {
    Line1?: string;
    City?: string;
    Country?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
  Active?: boolean;
  MetaData?: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

// QuickBooks Invoice Types
export interface QuickBooksInvoice {
  Id?: string;
  SyncToken?: string;
  TxnDate?: string;
  DueDate?: string;
  DocNumber?: string;
  CustomerRef: {
    value: string;
    name?: string;
  };
  Line: QuickBooksInvoiceLine[];
  TotalAmt?: number;
  Balance?: number;
  EmailStatus?: 'NotSet' | 'NeedToSend' | 'EmailSent';
  BillEmail?: {
    Address: string;
  };
  MetaData?: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  CustomField?: Array<{
    DefinitionId: string;
    Name: string;
    Type: string;
    StringValue?: string;
  }>;
}

export interface QuickBooksInvoiceLine {
  Id?: string;
  LineNum?: number;
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail';
  SalesItemLineDetail?: {
    ItemRef: {
      value: string;
      name?: string;
    };
    UnitPrice?: number;
    Qty?: number;
    TaxCodeRef?: {
      value: string;
    };
  };
  Description?: string;
}

// QuickBooks Item Types
export interface QuickBooksItem {
  Id?: string;
  SyncToken?: string;
  Name: string;
  Description?: string;
  Active?: boolean;
  Type: 'Inventory' | 'NonInventory' | 'Service';
  UnitPrice?: number;
  IncomeAccountRef?: {
    value: string;
    name?: string;
  };
  ExpenseAccountRef?: {
    value: string;
    name?: string;
  };
  AssetAccountRef?: {
    value: string;
    name?: string;
  };
}

// QuickBooks API Response Types
export interface QuickBooksResponse<T> {
  QueryResponse?: {
    [key: string]: T[];
  } & {
    maxResults?: number;
    startPosition?: number;
  };
  time?: string;
  fault?: {
    Error: Array<{
      Detail: string;
      code: string;
      element?: string;
    }>;
    type: string;
  };
}

export interface QuickBooksError {
  fault: {
    Error: Array<{
      Detail: string;
      code: string;
      element?: string;
    }>;
    type: string;
  };
}

// Configuration Types
export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  scope: string[];
}

// Data Mapping Types (for Pipedrive integration)
export interface PipedriveToQuickBooksMapping {
  customer: {
    pipedrivePersonId: number;
    quickbooksCustomerId: string;
    lastSyncTime: string;
  };
  invoice: {
    pipedriveDealId: number;
    quickbooksInvoiceId: string;
    lastSyncTime: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
  };
}

export interface SyncStatus {
  success: boolean;
  message: string;
  errors?: string[];
  syncedCount?: number;
  skippedCount?: number;
} 