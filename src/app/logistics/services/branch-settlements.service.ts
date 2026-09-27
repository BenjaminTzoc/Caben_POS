import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { BranchSettlement, BranchSettlementStatus } from '../interfaces/branch-settlement.interface';

@Injectable({ providedIn: 'root' })
export class BranchSettlementsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/branch-settlements`;

  getToday(branchId?: string, date?: string): Observable<ApiResponse<BranchSettlement>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    if (date) params = params.set('date', date);
    return this.http.get<ApiResponse<BranchSettlement>>(`${this.baseUrl}/today`, { params });
  }

  list(branchId?: string, status?: BranchSettlementStatus): Observable<ApiResponse<BranchSettlement[]>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<BranchSettlement[]>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<BranchSettlement>> {
    return this.http.get<ApiResponse<BranchSettlement>>(`${this.baseUrl}/${id}`);
  }

  update(
    id: string,
    body: {
      notes?: string;
      items: Array<{
        productId: string;
        keepQty: number;
        notes?: string;
      }>;
    },
  ): Observable<ApiResponse<BranchSettlement>> {
    return this.http.put<ApiResponse<BranchSettlement>>(`${this.baseUrl}/${id}`, body);
  }

  createIncident(
    id: string,
    payload: { productId: string; quantity: number; description: string; files?: File[] },
  ): Observable<ApiResponse<BranchSettlement>> {
    const form = new FormData();
    form.append('productId', payload.productId);
    form.append('quantity', String(payload.quantity));
    form.append('description', payload.description);
    for (const file of payload.files ?? []) {
      form.append('attachments', file);
    }
    return this.http.post<ApiResponse<BranchSettlement>>(`${this.baseUrl}/${id}/incidents`, form);
  }

  updateIncident(
    id: string,
    incidentId: string,
    payload: { productId: string; quantity: number; description: string; files?: File[] },
  ): Observable<ApiResponse<BranchSettlement>> {
    const form = new FormData();
    form.append('productId', payload.productId);
    form.append('quantity', String(payload.quantity));
    form.append('description', payload.description);
    for (const file of payload.files ?? []) {
      form.append('attachments', file);
    }
    return this.http.patch<ApiResponse<BranchSettlement>>(
      `${this.baseUrl}/${id}/incidents/${incidentId}`,
      form,
    );
  }

  deleteIncident(id: string, incidentId: string): Observable<ApiResponse<BranchSettlement>> {
    return this.http.delete<ApiResponse<BranchSettlement>>(`${this.baseUrl}/${id}/incidents/${incidentId}`);
  }

  resolveIncident(
    id: string,
    incidentId: string,
    resolutionNotes: string,
  ): Observable<ApiResponse<BranchSettlement>> {
    return this.http.patch<ApiResponse<BranchSettlement>>(
      `${this.baseUrl}/${id}/incidents/${incidentId}/resolve`,
      { resolutionNotes },
    );
  }

  submitToday(
    body: {
      branchId?: string;
      notes?: string;
      items: Array<{ productId: string; keepQty: number }>;
      incidents: Array<{ productId: string; quantity: number; description: string }>;
      incidentFiles: File[][];
    },
  ): Observable<ApiResponse<BranchSettlement>> {
    const form = new FormData();
    if (body.branchId) form.append('branchId', body.branchId);
    if (body.notes) form.append('notes', body.notes);
    form.append('items', JSON.stringify(body.items));
    form.append('incidents', JSON.stringify(body.incidents));
    body.incidentFiles.forEach((files, index) => {
      for (const file of files) {
        form.append(`incident_${index}`, file);
      }
    });
    return this.http.post<ApiResponse<BranchSettlement>>(`${this.baseUrl}/submit-today`, form);
  }

  receive(
    id: string,
    body: {
      items: Array<{ productId: string; receivedQuantity: number }>;
      registerAsWaste?: boolean;
      notes?: string;
    },
  ): Observable<ApiResponse<BranchSettlement>> {
    return this.http.patch<ApiResponse<BranchSettlement>>(`${this.baseUrl}/${id}/receive`, body);
  }
}
