import { setNamesExtension } from 'native-dates/helpers/tokens';

// the two-letter weekday is moment's own invention, and Intl has no form for it. core cuts it from
// the short name where that works and otherwise prints the narrow form, the single letters a calendar
// in the language heads its columns with: S T Q Q S S D in portuguese, P S Ç P C C P in turkish.
// that covers the widely written languages. these are the long tail where it is not what a reader
// writes, with the row moment and day.js print for dd, monday first.
// a row is editable at app boot (weekdays.gd = 'Lu Mà Ci Ar Ha Sa Dò')
export const weekdays = {
  az: 'BE ÇA Çə CA Cü Şə Bz',
  hy: 'երկ երք չրք հնգ ուրբ շբթ կրկ',
  jv: 'Sn Sl Rb Km Jm Sp Mg',
  km: 'ច អ ព ព្រ សុ ស អា',
  lv: 'P O T C Pk S Sv',
  mi: 'Ma Tū We Tāi Pa Hā Ta',
  my: 'လာ ဂါ ဟူး ကြာ သော နေ နွေ',
  oc: 'dl dm dc dj dv ds dg',
  ps: 'د س چ پ ج ش ی',
  sw: 'J3 J4 J5 Al Ij J1 J2',
  yo: 'Aj Ìs Ọr Ọb Ẹt Àb Àì',
};

// the row for a tag is its own or its language's: sw-KE reads sw
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
