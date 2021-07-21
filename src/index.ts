/**
 * CN Address Parser
 * @class AddressParser
 * @author RandyChan
 * @version 1.0.2
 * @license MIT
 */

import { AREAS, IGNORE_WORDS, LASTNAMES, POSTFIXES, SYNONYMS } from './data';

class AddressParser {
  public static instance: AddressParser | null;

  protected synonyms: { [index: string]: string[]; } = {};

  constructor() {
    this.loadSynonyms();
  }

  /**
   * Initializer synonyms
   */
  protected loadSynonyms(): void {
    SYNONYMS.forEach(words => {
      words.forEach(word => {
        this.synonyms[word] = words;
      });
    });
  }

  /**
   * Get synonyms by name
   * @param name 
   * @returns 
   */
  protected getSynonyms(name: string): string[] {
    return this.synonyms[name] || [];
  }

  public static parse(address: string): { [index: string]: string; } {
    return this.getInstance()._parse(address);
  }

  protected _parse(address: string): { [index: string]: string; } {
    address = this.trimIgnores(address);

    const phoneNumber: string = this.guessPhoneNumber(address);
    address = phoneNumber ? address.replace(phoneNumber, ' ') : address;

    const name: string = this.guessName(address);
    address = name ? address.replace(name, ' ') : address;

    const idon: string = this.guessIdon(address);
    address = idon ? address.replace(idon, ' ') : address;

    let province = this.guess('province', address);
    let city = this.guess('city', province.rest, province.zipPrefix);
    const region = this.guess('region', city.rest, city.zipPrefix);

    if (region.found && !city.found) {
      city = this.getParent('city', region.zip);
    }

    if (city.found && !province.found) {
      province = this.getParent('province', city.zip);
    }
    const street = (region.rest || city.rest || province.rest || address).trim();
    const zip = (region.zip || city.zip || province.zip);

    return {
      phoneNumber,
      name,
      idon,
      street,
      zip,
      province: province.found,
      city: city.found,
      region: region.found,
    };
  }

  /**
   * Only guess Chinese address by type
   * @param type 
   * @param input 
   * @param zipPrefix 
   */
  protected guess(type: string, input: string, zipPrefix: string = ''): { [index: string]: string; } {
    input = input.trim();

    const options: { [index: string]: string; } = this.getOptions(type, zipPrefix);

    for (const [zip, option] of Object.entries(options)) {
      const variants = this.getVariants(option);
      for (const variant of variants) {
        if (0 === input.indexOf(variant)) {
          return {
            zip,
            found: option,
            rest: input.replace(variant, ' '),
            zipPrefix: this.getZipPrefix(type, zip)
          };
        }
      }
    }

    return {
      zip: '',
      found: '',
      rest: input,
      zipPrefix,
    };
  }

  /**
   * Get the list of China regions according to type and filter by zip perifx
   * @param type 
   * @param zipPrefix 
   * @returns 
   */
  protected getOptions(type: string, zipPrefix: string | null = null): { [index: string]: string; } {
    let options: { [index: string]: string; };
    switch (type) {
      case 'province':
        return AREAS.province_list;
      case 'city':
        options = AREAS.city_list;
        break;
      case 'regions':
      default:
        options = AREAS.county_list;
        break;
    }

    return Object.keys(options).filter(zip => {
      return zip.startsWith(String(zipPrefix));
    }).reduce((obj, key) => {
      return { ...obj, [key]: options[key] };
    }, {});
  }

  /**
   * Get addr name variants
   * @param name 
   * @returns 
   */
  protected getVariants(name: string): string[] {
    let variants: string[] = [name, this.trimPostfix(name)];

    variants.forEach(variant => {
      variants = variants.concat(this.getSynonyms(variant));
    });

    // filter empty value and be unique, sory by length.
    return Array.from(new Set(variants.filter(variant => !!variant))).sort((a, b) => {
      return b.length - a.length;
    });
  }

  /**
   * Remove unnecessary postfix
   * @param name 
   * @returns 
   */
  protected trimPostfix(name: string): string {
    const regex: RegExp = new RegExp(`^(.{2,99}?)(?:${POSTFIXES.join('|')})*$`, 'u');
    const result: RegExpMatchArray | null = name.match(regex);
    if (result === null) {
      return name;
    }

    return result[1];
  }

  /**
   * Get zip perfix
   * @param type 
   * @param zip 
   * @returns 
   */
  protected getZipPrefix(type: string, zip: string): string {
    if ('province' === type) {
      return zip.substr(0, 2);
    } else if ('city' === type) {
      return zip.substr(0, 4);
    }
    return zip;
  }

  /**
   * @param type 
   * @param zip 
   * @returns 
   */
  protected getParent(type: string, zip: string): { found: string, zip: string; } {
    let parentZip: string;
    let list: { [index: string]: string; };
    if ('province' === type) {
      parentZip = zip.substr(0, 2).concat('0000');
      list = AREAS.province_list;
    } else { // city
      parentZip = zip.substr(0, 4).concat('00');
      list = AREAS.city_list;
    }

    return {
      found: list[parentZip] || '',
      zip: parentZip || '',
    };
  }

  /**
   * Trim ignore words and punctuations
   * @param input
   * @returns
   */
  protected trimIgnores(input: string): string {
    const regex: RegExp = new RegExp(`(${IGNORE_WORDS.join('|')})`, 'g');
    return input.replace(regex, '').replace(/[,.，。:：;；"'‘“]+/g, '');
  }

  /**
   * Only guess Chinese mobile number
   * @param input
   * @returns
   */
  protected guessPhoneNumber(input: string): string {
    const result: RegExpMatchArray | null = input.match(/\b1\d{10}\b/u);
    if (result === null) {
      return '';
    }

    return result[0];
  }

  /**
   * Only guess Chinese name
   * @param input 
   * @returns 
   */
  protected guessName(input: string): string {
    const words: { index: number; value: string; }[] = input.split(/[\da-z\s（）()]+/iu).filter(word => word.length > 0).map((word, i) => {
      return { index: i, value: word };
    });

    // reorder words, search from outer to inner, like 0 1 2 3 4 to 0 4 1 3 2
    words.sort((a, b) => {
      const mid = (words.length - 1) / 2;
      return Math.abs(b.index - mid) - Math.abs(a.index - mid);
    });

    const filterWord = (words.filter(word => {
      if (
        word.value.length <= 4
        && word.value.length >= 2
        && LASTNAMES.filter(lastname => {
          return word.value.startsWith(lastname);
        })[0]
      ) {
        return word;
      }
    })[0]);

    return filterWord ? filterWord.value : '';
  }

  /**
   * Only guess Chinese id number
   * @param input 
   * @returns 
   */
  protected guessIdon(input: string): string {
    const result: RegExpMatchArray | null = input.match(/\d{17}(\d|X|x)/u);
    if (result === null) {
      return '';
    }

    return result[0].toLowerCase();
  }

  /**
   * Get AddressParse Instance
   * @returns
   */
  public static getInstance(): AddressParser {
    return this.instance || (this.instance = new this());
  }
}

export default AddressParser;
