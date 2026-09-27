import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { Category, Product } from '../interfaces/product.interface';

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/products`;

  getProducts(
    branchId?: string,
    includeDeleted: boolean = false,
    type?: string,
    hasRecipe?: boolean,
    isMaster?: boolean,
    excludeTypes?: string,
    manageStock?: boolean,
    minimal?: boolean,
  ): Observable<ApiResponse<Product[]>> {
    return this.requestProducts({
      branchId,
      includeDeleted,
      type,
      hasRecipe,
      isMaster,
      excludeTypes,
      manageStock,
      minimal,
    }) as Observable<ApiResponse<Product[]>>;
  }

  getProductsPage(
    paging: { page: number; limit: number; search?: string },
    options?: {
      branchId?: string;
      includeDeleted?: boolean;
      type?: string;
      hasRecipe?: boolean;
      isMaster?: boolean;
      excludeTypes?: string;
      manageStock?: boolean;
      minimal?: boolean;
    },
  ): Observable<ApiResponse<PaginatedProducts>> {
    return this.requestProducts({
      ...options,
      includeDeleted: options?.includeDeleted ?? false,
      paging,
    }) as Observable<ApiResponse<PaginatedProducts>>;
  }

  private requestProducts(args: {
    branchId?: string;
    includeDeleted?: boolean;
    type?: string;
    hasRecipe?: boolean;
    isMaster?: boolean;
    excludeTypes?: string;
    manageStock?: boolean;
    minimal?: boolean;
    paging?: { page?: number; limit?: number; search?: string };
  }): Observable<ApiResponse<Product[] | PaginatedProducts>> {
    let params = new HttpParams();
    if (args.includeDeleted === true) {
      params = params.set('includeDeleted', 'true');
    }
    if (args.branchId) {
      params = params.set('branchId', args.branchId);
    }
    if (args.type) {
      params = params.set('type', args.type);
    }
    if (args.hasRecipe !== undefined) {
      params = params.set('hasRecipe', args.hasRecipe.toString());
    }
    if (args.isMaster !== undefined) {
      params = params.set('isMaster', args.isMaster.toString());
    }
    if (args.excludeTypes) {
      params = params.set('excludeTypes', args.excludeTypes);
    }
    if (args.manageStock !== undefined) {
      params = params.set('manageStock', args.manageStock.toString());
    }
    if (args.minimal !== undefined) {
      params = params.set('minimal', args.minimal.toString());
    }
    if (args.paging?.page != null) {
      params = params.set('page', String(args.paging.page));
    }
    if (args.paging?.limit != null) {
      params = params.set('limit', String(args.paging.limit));
    }
    if (args.paging?.search?.trim()) {
      params = params.set('search', args.paging.search.trim());
    }

    return this.http.get<ApiResponse<Product[] | PaginatedProducts>>(`${this.API_URL}`, { params });
  }

  getProduct(productId: string, includeDeleted: boolean = false): Observable<ApiResponse<Product>> {
    let params = new HttpParams().set('includeDeleted', includeDeleted.toString());
    return this.http.get<ApiResponse<Product>>(`${this.API_URL}/${productId}`, { params });
  }

  searchProducts(
    query: string,
    branchId?: string,
    includeDeleted: boolean = false,
    type?: string,
    hasRecipe?: boolean,
    isMaster?: boolean,
    excludeTypes?: string,
    minimal?: boolean
  ): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams().set('q', query).set('includeDeleted', includeDeleted.toString());

    if (branchId) {
      params = params.set('branchId', branchId);
    }
    if (type) {
      params = params.set('type', type);
    }
    if (hasRecipe !== undefined) {
      params = params.set('hasRecipe', hasRecipe.toString());
    }
    if (isMaster !== undefined) {
      params = params.set('isMaster', isMaster.toString());
    }
    if (excludeTypes) {
      params = params.set('excludeTypes', excludeTypes);
    }
    if (minimal !== undefined) {
      params = params.set('minimal', minimal.toString());
    }

    return this.http.get<ApiResponse<Product[]>>(`${this.API_URL}/search`, { params });
  }

  createProduct(data: FormData | any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}`, data);
  }

  updateProduct(id: string, data: FormData | any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/${id}`, data);
  }

  deleteProduct(productId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${productId}`);
  }

  restoreProduct(productId: string): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.API_URL}/${productId}/restore`, {});
  }

  getCategories(showDeleted: boolean = false): Observable<ApiResponse<Category[]>> {
    let params = new HttpParams().set('includeDeleted', showDeleted.toString());
    return this.http.get<ApiResponse<Category[]>>(`${this.API_URL}/categories`, { params });
  }

  getCategory(idCategory: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.API_URL}/categories/${idCategory}`);
  }

  createCategory(body: any): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.API_URL}/categories`, body);
  }

  editCategory(categoryId: string, body: any): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.API_URL}/categories/${categoryId}`, body);
  }

  deleteCategory(idCategory: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/categories/${idCategory}`);
  }

  restoreCategory(idCategory: string): Observable<ApiResponse<Category>> {
    return this.http.patch<ApiResponse<Category>>(
      `${this.API_URL}/categories/${idCategory}/restore`,
      {},
    );
  }

  getTopSelling(branchId?: string): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();

    if (branchId) {
      params = params.set('branchId', branchId);
    }

    return this.http.get<ApiResponse<Product[]>>(`${this.API_URL}/top-selling`, { params });
  }

  getBranchCatalog(branchId: string, isMaster: boolean = false, manageStock?: boolean, hasStock?: boolean): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (isMaster !== undefined) {
      params = params.set('isMaster', isMaster.toString());
    }
    if (manageStock !== undefined) {
      params = params.set('manageStock', manageStock.toString());
    }
    if (hasStock !== undefined) {
      params = params.set('hasStock', hasStock.toString());
    }
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/branch/${branchId}/catalog`, { params });
  }

  getQuotationCatalog(branchId: string, isMaster: boolean = false): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (isMaster !== undefined) {
      params = params.set('isMaster', isMaster.toString());
    }
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/branch/${branchId}/quotation-catalog`, { params });
  }

  getDispatchCatalog(branchId?: string): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<Product[]>>(`${this.API_URL}/dispatch-catalog`, { params });
  }

  suggestSku(categoryId?: string, type?: string, name?: string): Observable<ApiResponse<{ sku: string }>> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    if (type) params = params.set('type', type);
    if (name) params = params.set('name', name);
    
    return this.http.get<ApiResponse<{ sku: string }>>(`${this.API_URL}/suggest-sku`, { params });
  }
}
