import { ApiSuccessResponse, UUID } from './common';

export interface SearchResultItem {
    type: 'company' | 'contact' | 'deal';
    id: UUID;
    title: string;
    subtitle: string;
    href: string;
}

export type GlobalSearchResponse = ApiSuccessResponse<SearchResultItem[]>;
