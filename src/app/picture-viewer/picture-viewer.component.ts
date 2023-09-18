import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FireService } from '../shared/fire.service';
@Component({
  selector: 'app-picture-viewer',
  templateUrl: './picture-viewer.component.html',
  styleUrls: ['./picture-viewer.component.scss']
})
export class PictureViewerComponent implements OnInit {

  constructor(private route: ActivatedRoute, private http: HttpClient,  private router: Router, public fireService: FireService,) { }
  url:any
  myThumbnail: any;
  myFullresImage: any;
  xmlData: string | null;
  xmlDataArray: string[] = [];
  objectIds: number[] = [];
  coordinatenFoto: any[][] = []
  coordinatenClick: any[][] = []
  availableImages: any[] = []
  
  ngOnInit(): void {
    //Haalt data op van model component om foto te laden
    this.route.queryParams.subscribe((params:any) => {
      this.url = params.data;
      this.myThumbnail = params.data;
      this.myFullresImage = params.data;
    });
    console.log(this.url)

    //Kijkt of user nog is ingelogd
    if(this.fireService.auth.currentUser == null) {
      this.router.navigate(['/login']);
    } 
  }

public goToPictureViewer(url): void {
  //Stuurt verkregen data door naar PictureViewer
  console.log(url)
  this.router.navigate(['pictureViewer'], { queryParams: { data: url } });
}   
 
// Ga terug naar asset.
loadAsset(assetId: number) {
  this.router.navigate(["model", {assetId: assetId}]);   
}




}
