import parse from 'parse-github-url';
import axios from 'axios';

import { gh } from './Shared';
import errno from './errno';

class Module {
  constructor(url) {
    const { owner, name } = parse(url);
    this.url = url;
    this.name = name;
    this.owner = owner;
    this.metalink = `https://raw.githubusercontent.com/${owner}/${name}/master/module.prop`;
  }

  async load() {
    let prop;
    try {
      prop = await axios.get(this.metalink);
    } catch (e) {
      throw errno.ENOPROP;
    }
    prop.data.split('\n').forEach((line) => {
      const s = line.split('=');
      if (s.length !== 2) {
        return;
      }
      this[s[0].trim()] = s[1].trim();
    });
    if (this.id === undefined || !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(this.id)) {
      errno.throw(errno.EINVALID, this.id);
    }
    if (this.versionCode === undefined || !/^\d+$/.test(this.versionCode)) {
      errno.throw(errno.EINVALCODE, this.versionCode);
    }
    const version = this.minMagisk ? this.minMagisk : this.template;
    if (version < 1500) {
      errno.throw(errno.EOUTDATE, version);
    }
    return this;
  }

  getRepo() {
    return gh.getRepo(this.owner, this.id);
  }
}

export default Module;