import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { LoginModel } from '../common/storage/login-info-storage/login-info.model';
import { LoginBusiness } from './login.business';

@Component({
  selector: 'hw-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.less',
  providers: [LoginBusiness],
})
export class LoginComponent implements OnInit, OnDestroy {
  constructor(
    title: Title,
    private toastr: ToastrService,
    private business: LoginBusiness,
  ) {
    this.business.title.then((x) => {
      title.setTitle(x);
    });
  }

  model = this.init();
  remember = false;
  handle: any;

  private init() {
    let model = new LoginModel();
    return model;
  }

  ngOnInit(): void {
    this.handle = this.on.keypress.bind(this);
    window.addEventListener('keypress', this.handle);

    this.business.init();
    let model = this.business.load();
    if (model) {
      this.model = model;
      if (this.model.save) {
        this.remember = this.model.save;
      }
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('keypress', this.handle);
  }

  private get check() {
    if (!this.model.username) {
      this.toastr.warning('请输入账号');
      return false;
    }
    if (!this.model.password) {
      this.toastr.warning('请输入密码');
      return false;
    }
    return true;
  }

  on = {
    login: () => {
      if (this.check) {
        this.business
          .login(this.model.username, this.model.password)
          .then(() => {
            if (this.remember) {
              this.business.remember(this.model.username, this.model.password);
            } else {
              this.business.forget();
            }
          })
          .catch((x) => {
            this.toastr.error('用户名或密码错误');
          });
      }
    },
    keypress: (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.on.login();
      }
    },
  };
}
