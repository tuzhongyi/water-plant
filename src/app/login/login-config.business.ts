// import { Injectable } from '@angular/core';
// import { LocalStorage } from '../common/storage/local.storage';
// import { User } from '../common/data-core/models/user/user.model';

// @Injectable()
// export class LoginConfigController {
//   constructor(
//     private service: UserRequestService,
//     private local: LocalStorage
//   ) {}
//   load(user: User) {
//     this.video(user);
//   }

//   private video(user: User) {
//     // this.service.config.get(user.Id, UserConfigType.VideoStream).then((x) => {
//     //   if (x) {
//     //     this.local.video.stream = parseInt(x);
//     //   }
//     // });
//     this.service.config
//       .get(user.Id, UserConfigType.VideoRuleState)
//       .then((x) => {
//         this.local.video.rule = JSON.parse(x);
//       });
//   }
// }
