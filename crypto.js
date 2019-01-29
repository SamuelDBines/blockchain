const max_leng = 10;
const end_pass = 10;


const ref = {
  "31": "",
  "32": " ",
  "33": "!",
  "34": "\"",
  "35": "#",
  "36": "$",
  "37": "%",
  "38": "&",
  "39": "'",
  "40": "(",
  "41": ")",
  "42": "*",
  "43": "+",
  "44": ",",
  "45": "-",
  "46": ".",
  "47": "/",
  "48": "0",
  "49": "1",
  "50": "2",
  "51": "3",
  "52": "4",
  "53": "5",
  "54": "6",
  "55": "7",
  "56": "8",
  "57": "9",
  "58": ":",
  "59": ";",
  "60": "<",
  "61": "=",
  "62": ">",
  "63": "?",
  "64": "@",
  "65": "A",
  "66": "B",
  "67": "C",
  "68": "D",
  "69": "E",
  "70": "F",
  "71": "G",
  "72": "H",
  "73": "I",
  "74": "J",
  "75": "K",
  "76": "L",
  "77": "M",
  "78": "N",
  "79": "O",
  "80": "P",
  "81": "Q",
  "82": "R",
  "83": "S",
  "84": "T",
  "85": "U",
  "86": "V",
  "87": "W",
  "88": "X",
  "89": "Y",
  "90": "Z",
  "91": "[",
  "92": "\\",
  "93": "]",
  "94": "^",
  "95": "_",
  "96": "`",
  "97": "a",
  "98": "b",
  "99": "c",
  "100": "d",
  "101": "e",
  "102": "f",
  "103": "g",
  "104": "h",
  "105": "i",
  "106": "j",
  "107": "k",
  "108": "l",
  "109": "m",
  "110": "n",
  "111": "o",
  "112": "p",
  "113": "q",
  "114": "r",
  "115": "s",
  "116": "t",
  "117": "u",
  "118": "v",
  "119": "w",
  "120": "x",
  "121": "y",
  "122": "z",
  "123": "{",
  "124": "|",
  "125": "}",
  "126": "~",
  "127": ""
}
const rotate = ['',
  ' ',
  '!',
  '"',
  '#',
  '$',
  '%',
  '&',
  '\'',
  '(',
  ')',
  '*',
  '+',
  ',',
  '-',
  '.',
  '/',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  ':',
  ';',
  '<',
  '=',
  '>',
  '?',
  '@',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '[',
  '\\',
  ']',
  '^',
  '_',
  '`',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '{',
  '|',
  '}',
  '~',
  ''
]

function createCipher(key, passcode) {
  bufStr = passcode;
  //  console.log(passcode["31"])
  console.log(typeof passcode === 'string')
  bufStr = bufStr.match(/.{1,10}/g)
  // try {
  // console.log(bufStr)
  bufStr[bufStr.length - 1] = extendString(bufStr[bufStr.length - 1]);

  bufStr = bufStr.map(e => e.split("")).map(e => pass(e))
  // console.log(bufStr)

  let result = bufStr[0];
  console.log(result)
  if (bufStr.length < 2)
    result = passValue(result)
  for (i = 1; i < bufStr.length; i++) {
    result = crypt(result, bufStr[i])

  }
  console.log(result)
  return result.join("");
}

function pass(section) {
  return section.map(item => {
    let value = rotate.indexOf(item) + 10;
    if (value > rotate.length)
      value = value - rotate.length
    return value;
  })
}

function passValue(section) {
  return section.map(e => {
    return rotate[e];
  })
}

function crypt(add, next) {
  return add.map((e, i) => {
    let value = e + next[i];
    if (value >= rotate.length)
      value = value - rotate.length
    return rotate[value];
  })
}

function decrypt(string, cipher) {
  return createCipher(1, string) == cipher
}

function extendString(string) {
  while (string.length < 10) {
    string = string + " ";
  }
  return string;
}
console.log(extendString("t"));
console.time('test');
const stringy = JSON.stringify(ref).toString()
const cipher = createCipher(1, '{"string": "test"}');
console.log(cipher)
const cipher2 = createCipher(1, cipher);
console.log(cipher2)
console.timeEnd('test'); //Prints something like that-> test: 11374.004ms
console.time('test');
console.log(decrypt(cipher, cipher2));
console.timeEnd('test'); //Prints something like that-> test: 11374.004ms