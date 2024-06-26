import { Component, ElementRef, OnInit, ViewChild, Output, AfterViewInit, EventEmitter } from '@angular/core';
import { DataService } from './data.service';
import anime from 'animejs';
import { LocalStorageService } from './local-storage.service';
import { SaveService } from './save.service';

interface Project {
  canvaFile: {};
  nameProject: string;
  creationDate: string;
  modificationDate: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @Output() signChangeMenu = new EventEmitter<string>();

  @ViewChild('headerHome') headerHome!: ElementRef;
  @ViewChild('home') home!: ElementRef;
  @ViewChild('contentEdit') contentEdit!: ElementRef;
  @ViewChild('openFileImage') fileInput: ElementRef | undefined;

  title = 'typeCircle';
  selectEntry: number = -1;
  arrayEntry: { idEntry?: number, text?: string, select?: boolean }[] = [];
  availableFonts: any = [];
  selectTopHeader: number = 0;
  selectMenu: number = 0;
  selectBottomHeader: number = 0;
  showHome: boolean = true;
  isInAnimation: boolean = false;
  isAnimationOpenEdit: boolean = false;
  file?: File;
  projectDisplay: any[] = [];

  constructor(
    private dataService: DataService,
    private localStorageService: LocalStorageService,
    private saveService: SaveService
  ) { }

  ngOnInit() {
    this.subscribeToDataService();
    this.projectDisplay = this.getProjectsFromLocalStorage();
    // this.clearProjectsFromLocalStorage();
    // this.debugMode();
  }

  ngAfterViewInit() {
    if (this.projectDisplay.length === 0) {
      this.animateBalls();
    }
  }

  // Data Service Subscriptions
  private subscribeToDataService() {
    this.dataService.boxCreate$.subscribe(data => this.addNewBoxEntry(data));
    this.dataService.boxChange$.subscribe(data => this.changeBoxEntry(data));
    this.dataService.boxSelect$.subscribe(data => this.selectBoxEntry(data));
    this.dataService.boxDelete$.subscribe(data => this.deleteBoxEntry(data));
    this.dataService.boxAllDelete$.subscribe(() => this.deleteAllBoxEntry());
  }

  // Box Entry Handlers
  private addNewBoxEntry({ idBox, text }: { idBox: number; text: string }) {
    this.selectEntry = idBox;
    this.arrayEntry.push({ idEntry: idBox, text, select: false });
  }

  private changeBoxEntry({ idBox, text }: { idBox: number; text: string }) {
    this.selectEntry = idBox;
    const entry = this.arrayEntry[idBox];
    if (entry) {
      entry.text = text;
    }
  }

  private selectBoxEntry({ idBox, isSelect }: { idBox: number; isSelect: boolean }) {
    this.selectEntry = idBox;
    this.arrayEntry[idBox] = { ...this.arrayEntry[idBox], select: isSelect };
  }

  private deleteBoxEntry({ idBox }: { idBox: number }) {
    if (idBox >= 0 && idBox < this.arrayEntry.length) {
      this.arrayEntry.splice(idBox, 1);
    }
  }

  private deleteAllBoxEntry() {
    this.arrayEntry = [];
  }

  // Header Handlers
  changeTopHeader(selectTopHeader: number) {
    this.selectTopHeader = selectTopHeader;
  }

  changeBottomHeader(selectBottomHeader: number) {
    this.selectBottomHeader = selectBottomHeader;
  }

  changeDashBoard(imageURL: File) {
    this.showHome = false;
    setTimeout(() => {
      this.dataService.addImageCanva(imageURL);
    });
  }

  changeMenu(numberChange: number) {
    this.selectMenu = numberChange;
    if (numberChange === 0) {
      this.closeImage();
    }
  }

  // File Handling
  openImage() {
    if (!this.isAnimationOpenEdit) {
      this.fileInput?.nativeElement.click();
    }
  }

  handleFileInput(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.addProjectToLocalStorage();
      this.initAnimateOpenImage();

      const file = event.target.files[0];
      this.file = file;
      const imageUrl = URL.createObjectURL(file);

      const [fileNameWithoutExtension, fileExtension] = file.name.split('.');

      this.saveService.arrayFiles.push({
        pathFile: imageUrl,
        nameFile: fileNameWithoutExtension,
        extensionFile: fileExtension,
        select: true
      });
    }
  }

  // Animation
  animateBalls() {
    anime({
      targets: '.element-rowBalls-noProjects',
      backgroundColor: [
        { value: '#3D3D3D', duration: 1000 },
        { value: '#262626', duration: 1000 }
      ],
      delay: anime.stagger(500, { start: 500 }), // interval between each ball's animation
      loop: true
    });
  }

  private initAnimateOpenImage() {
    const home = this.home.nativeElement;
    const headerHomeElement = this.headerHome.nativeElement;
    const homeGap = getComputedStyle(home).gap;
    const headerHomePadding = getComputedStyle(headerHomeElement).padding;
    const headerHomeHeight = headerHomeElement.offsetHeight;

    this.animateOpenImage(home, homeGap, headerHomeElement, headerHomePadding, headerHomeHeight);
  }

  private animateOpenImage(home: HTMLElement, homeGap: string, headerHomeElement: HTMLElement, headerHomePadding: string, headerHomeHeight: number) {
    anime({
      targets: home,
      gap: [homeGap, "0px"],
      duration: 300,
      easing: 'easeInOutQuad'
    });

    anime({
      targets: "#isHome",
      opacity: [1, 0],
      duration: 150,
      easing: 'easeInOutQuad'
    });

    anime({
      targets: headerHomeElement,
      top: ['0px', `-${headerHomeHeight}px`],
      height: [`${headerHomeHeight}px`, "0px"],
      paddingBottom: [headerHomePadding, "0px"],
      paddingTop: [headerHomePadding, "0px"],
      opacity: [1, 0],
      duration: 200,
      easing: 'easeInExpo',
      complete: () => this.onOpenImageComplete()
    });
  }

  private onOpenImageComplete() {
    if (this.file) {
      this.dataService.addImageCanva(this.file);
    } else {
      this.dataService.sendOpenProject();
    }
    this.showHome = false;
    this.selectMenu = 1;

    setTimeout(() => {
      anime({
        targets: "#shortenedHeader",
        opacity: [0, 1],
        top: ["-65px", "-35px"],
        duration: 250,
        easing: 'easeOutElastic'
      });

      anime({
        targets: "#main",
        opacity: [0, 1],
        duration: 150,
        easing: 'easeInOutQuad'
      });

      this.isAnimationOpenEdit = true;
    }, 0);
  }

  closeImage() {
    if (this.isAnimationOpenEdit) {
      this.projectDisplay = this.getProjectsFromLocalStorage();
      this.animateCloseImage();
    }
  }

  private animateCloseImage() {
    anime({
      targets: "#shortenedHeader",
      opacity: [1, 0],
      top: ["-35px", "-65px"],
      duration: 250,
      easing: 'easeInOutElastic'
    });

    anime({
      targets: "#main",
      opacity: [1, 0],
      duration: 150,
      easing: 'easeInOutQuad',
      complete: () => this.onCloseImageComplete()
    });
  }

  private onCloseImageComplete() {
    this.showHome = true;

    const home = this.home.nativeElement;
    const headerHomeElement = this.headerHome.nativeElement;
    const headerHomeHeight = headerHomeElement.scrollHeight;

    anime({
      targets: home,
      gap: ["0px", "24px"],
      duration: 300,
      easing: 'easeInOutQuad'
    });

    anime({
      targets: headerHomeElement,
      top: ['-91px', '0px'],
      height: ['0px', `${headerHomeHeight + 20}px`],
      paddingBottom: ["0px", "10px"],
      paddingTop: ["0px", "10px"],
      opacity: [0, 1],
      duration: 200,
      easing: 'easeInOutExpo',
      complete: () => this.onResetHeaderComplete()
    });
  }

  private onResetHeaderComplete() {
    anime({
      targets: "#isHome",
      opacity: [0, 1],
      duration: 150,
      easing: 'easeInOutQuad',
      complete: () => {
        this.isAnimationOpenEdit = false;
        this.isInAnimation = false;
      }
    });
  }

  openProject(index: number) {
    if (!this.isInAnimation) {
      this.isInAnimation = true;
      this.saveService.arrayFiles = [];
      this.localStorageService.setSelectedProject(index);
      this.file = undefined;
      this.initAnimateOpenImage();
    }
  }

  // Local Storage Handlers
  private addProjectToLocalStorage() {
    const { date, time } = this.getFormattedDateTime();

    const newProject: Project = {
      canvaFile: [],
      nameProject: 'Project ' + (this.projectDisplay.length + 1),
      creationDate: `${date} ${time}`,
      modificationDate: `${date} ${time}`
    };

    this.localStorageService.addProject(newProject);
    const projectIndex = this.projectDisplay ? this.projectDisplay.length : 0;
    this.localStorageService.setSelectedProject(projectIndex);
  }

  private getProjectsFromLocalStorage() {
    return this.localStorageService.getProjects();
  }

  private clearProjectsFromLocalStorage() {
    this.localStorageService.clearProjects();
  }

  // Utility Functions
  private getFormattedDateTime() {
    const userLocale = navigator.language || 'en-US';

    const currentDate = new Date();

    const formattedDate = new Intl.DateTimeFormat(userLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(currentDate);

    const formattedTime = new Intl.DateTimeFormat(userLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(currentDate);

    return {
      date: formattedDate,
      time: formattedTime
    };
  }

  // Box Recent Handlers
  onDeleteBoxRecent(index: number) {
    this.localStorageService.removeProject(index);
    this.projectDisplay = this.getProjectsFromLocalStorage();
  }

  // Debug Mode
  async fetchImageAsFile(imagePath: string, fileName: string): Promise<File> {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  }

  async debugMode() {
    this.showHome = false;
    setTimeout(async () => {
      this.contentEdit.nativeElement.style.opacity = 1;
      this.headerHome.nativeElement.style.display = "none";

      const file = await this.fetchImageAsFile("/assets/testImages/read-sensei-wa-koi.png", "read-sensei-wa-koi.png");
      this.dataService.addImageCanva(file);
    });
  }
}