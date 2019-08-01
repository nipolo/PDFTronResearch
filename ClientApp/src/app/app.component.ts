import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

declare const WebViewer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {

  private docInstance: any;

  documentLoaded: boolean;
  pages: number[] = [];

  pageManipulationForm: FormGroup;
  editPageControl: FormControl;
  moveFromPageControl: FormControl;
  moveToPageControl: FormControl;
  insertAtPageControl: FormControl;

  @ViewChild('viewer', { static: false })
  viewer: ElementRef;

  get document() {
    return this.docInstance.docViewer.getDocument();
  }

  get docViewer() {
    return this.docInstance.docViewer;
  }

  get coreControls() {
    return this.docInstance.CoreControls;
  }

  get pagesForInsert(): number[] {
    return [...this.pages, this.pages.length + 1];
  }

  constructor(
    private _cd: ChangeDetectorRef,
    private _fb: FormBuilder,
    private _http: HttpClient
  ) {
    this.pageManipulationForm = this._fb.group({
      editPage: (this.editPageControl = this._fb.control('')),
      moveFromPage: (this.moveFromPageControl = this._fb.control('')),
      moveToPage: (this.moveToPageControl = this._fb.control('')),
      insertAtPage: (this.insertAtPageControl = this._fb.control(''))
    })
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    WebViewer({
      path: '../lib',
      initialDoc: '../pdfs/2019_eng.pdf',
      useDownloader: false,
      fullAPI: true
    }, this.viewer.nativeElement)
      .then(instance => {
        this.docInstance = instance;
        this.docInstance.docViewer.on('documentLoaded', () => {
          this.documentLoaded = true;
          this.updatePages(this.docInstance.docViewer.getPageCount());
        })
      });
  }

  updatePages(pageCount) {
    this.pages = [...Array.from(new Array(pageCount), (value, index) => index + 1)];
    this.pageManipulationForm.reset();
    this._cd.detectChanges();
  };

  rotatePage() {
    if (!this.documentLoaded) {
      return;
    }

    this.document.rotatePages([Number(this.editPageControl.value)], this.coreControls.PageRotation.e_90);
  }

  cropPages() {
    if (!this.documentLoaded) {
      return;
    }

    this.document.cropPages([Number(this.editPageControl.value)], 40, 40, 40, 40);
  }

  deletePages = function () {
    var newPageCount = this.document.getPageCount() - 1;

    // Delete pages
    this.document.removePages([Number(this.editPageControl.value)]);
    this.updatePages(newPageCount);
  };

  reorderPages() {
    var pageFrom = Number(this.moveFromPageControl.value);
    var pageTo = Number(this.moveToPageControl.value);
    if (pageFrom < pageTo) {
      pageTo++;
    }

    // Move pages
    this.document.movePages([pageFrom], pageTo);
  };

  insertBlankPage() {
    var info = this.document.getPageInfo(0);
    var width = info.width;
    var height = info.height;
    var newPageCount = this.document.getPageCount() + 1;

    // Insert blank pages
    this.document.insertBlankPages([Number(this.insertAtPageControl.value)], width, height);
    this.updatePages(newPageCount);
  };

  mergeWithFile(e) {
    var file = e.target.files[0];

    var newDoc = new this.coreControls.Document(file.name, 'pdf');
    var ext = file.name.split('.').slice(-1)[0];
    this.coreControls.getDefaultBackendType().then((backendType) => {
      var options = {
        workerTransportPromise: this.coreControls.initPDFWorkerTransports(backendType, {}/* , license key here */),
        extension: ext
      };
      var partRetriever = new this.coreControls.PartRetrievers.LocalPdfPartRetriever(file);

      newDoc.loadAsync(partRetriever, (err) => {
        if (err) {
          console.error('Could not open file, please try again');
          return;
        }
        var pages = [];
        for (var i = 0; i < newDoc.numPages; i++) {
          pages.push(i + 1);
        }
        var newPageCount = this.document.getPageCount() + newDoc.numPages;
        // Insert (merge) pages
        this.document.insertPages(newDoc, pages, this.document.numPages + 1);
        this.updatePages(newPageCount);
      }, options);
    });
  };

  upload() {
    var options = {
      xfdfString: this.docViewer.getAnnotationManager().exportAnnotations()
    };

    this.document.getFileData(options).then((data) => {
      var arr = new Uint8Array(data);
      var blob = new Blob([arr], {
        type: 'application/pdf'
      });

      this._http.post('/api/file/Upload', blob).subscribe();
    });
  }
}
