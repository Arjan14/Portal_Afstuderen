import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ETRS89MultiPoint {
  type: any;
  data: {
    coordinates: number[][],
    type: string,
  },
  maxDeviationLongLineSegments: any | null,
  projVersion: string,
  timestamp: string,
  transformationMethod: string,
}

@Injectable({
  providedIn: 'root'
})
export class NsgiService {

  constructor(private http: HttpClient) { }

  // Zet een gegeven punt om van RD naar ETRS89
  rdPointToETRS89(point: number[]): Observable<any> {
    return this.http.post<any>('https://api.transformation.nsgi.nl/v1/transform',
      {
        'data': {
          'type': 'Point',
          'coordinates': point
        }
      },
      this.getOptions(),
    );
  }

  // Zet gegeven punten om van RD naar ETRS89, dmv. API
  rdMultiPointToETRS89(points: number[][]): Observable<ETRS89MultiPoint> {
    return this.http.post<ETRS89MultiPoint>('https://api.transformation.nsgi.nl/v1/transform',
      {
        'data': {
          'type': 'MultiPoint',
          'coordinates': points
        }
      },
      this.getOptions(),
    ) as Observable<ETRS89MultiPoint>;
  }

  //Config
  private getOptions() {
    const headers: HttpHeaders = new HttpHeaders({
      'Accept-Crs': 'EPSG:7931',
      'Content-Crs': 'EPSG:7415',
      'X-Api-Key': environment.NsgiTransformApiKey,
      'Content-Type': 'application/json',
    });
    const options: any = {
      headers,
    }
    return options;
  }
}