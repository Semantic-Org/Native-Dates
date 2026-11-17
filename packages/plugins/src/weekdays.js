import { setNamesExtension } from 'native-dates/helpers/tokens';

// the two-letter weekday is moment's own invention, and Intl has no form for it. core cuts it from
// the short name where that works and otherwise prints the narrow form, which in these languages
// repeats a letter, borrows english ones or counts the days. each row is what moment and day.js
// print for dd, monday first, and is editable at app boot (weekdays.gd = 'Lu Mà Ci Ar Ha Sa Dò')
export const weekdays = {
  az: 'BE ÇA Çə CA Cü Şə Bz',
  hu: 'h k sze cs p szo v',
  hy: 'երկ երք չրք հնգ ուրբ շբթ կրկ',
  id: 'Sn Sl Rb Km Jm Sb Mg',
  jv: 'Sn Sl Rb Km Jm Sp Mg',
  km: 'ច អ ព ព្រ សុ ស អា',
  lv: 'P O T C Pk S Sv',
  mi: 'Ma Tū We Tāi Pa Hā Ta',
  my: 'လာ ဂါ ဟူး ကြာ သော နေ နွေ',
  oc: 'dl dm dc dj dv ds dg',
  ps: 'د س چ پ ج ش ی',
  pt: '2ª 3ª 4ª 5ª 6ª Sá Do',
  'pt-BR': '2ª 3ª 4ª 5ª 6ª sá do',
  sw: 'J3 J4 J5 Al Ij J1 J2',
  tr: 'Pt Sa Ça Pe Cu Ct Pz',
  ur: 'پیر منگل بدھ جمعرات جمعہ ہفتہ اتوار',
  yo: 'Aj Ìs Ọr Ọb Ẹt Àb Àì',
};

// the row for a tag is its own or its language's: pt-PT reads pt, and pt-BR its own
setNamesExtension((language) => {
  const tags = language.split('-');
  while (tags.length) {
    const row = weekdays[tags.join('-')];
    if (row) {
      return { dd: row.split(' ') };
    }
    tags.pop();
  }
});
