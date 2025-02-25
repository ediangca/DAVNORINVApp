import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgToastModule, NgToastService, ToasterPosition } from 'ng-angular-popup' // to be added
import { NgxScannerQrcodeModule } from 'ngx-scanner-qrcode';


import { trigger, state, style, transition, animate } from '@angular/animations';

import AOS from 'aos';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FontAwesomeModule, CommonModule, ReactiveFormsModule, HttpClientModule, SweetAlert2Module, NgToastModule, NgxScannerQrcodeModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('showHide', [
      state('show', style({
        opacity: 1,
        display: 'block'
      })),
      state('hide', style({
        opacity: 0,
        display: 'none'
      })),
      transition('show <=> hide', [
        animate('0.5s')
      ])
    ])
  ],

})
export class AppComponent implements OnInit {
  appName: string = 'DDNAEINV';
  faCoffee = faCoffee;

  public assetPath: string = 'assets/images/dashboard/top-header.png';
  public logoPath: string = 'assets/images/logo/logo-sm.png';
  public loadingPath: string = 'assets/images/logo/loading.gif';

  ToasterPosition = ToasterPosition
  title: string = "DDNAEINV";

  constructor() {
  }

  ngOnInit() {
    AOS.init({ disable: 'mobile' });//AOS - 2
    AOS.refresh();//refresh method is called on window resize and so on, as it doesn't require to build new store with AOS elements and should be as light as possible.
  
  }


}
