
import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

import SkyRemote = require('sky-remote');
import SkyQCheck = require('sky-q');

interface SkyTVDeviceConfig {
  name?: string;
  ipAddress?: string;
}

interface SkyTVConfig extends PlatformConfig {
  devices?: SkyTVDeviceConfig[];
}

export class SkyTVPlugin implements DynamicPlatformPlugin {
  private readonly accessories: PlatformAccessory[] = [];

  constructor(
    private readonly log: Logger,
    private readonly config: SkyTVConfig,
    private readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', PLATFORM_NAME);

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices(): void {
    if (!this.config.devices || !Array.isArray(this.config.devices)) {
      this.log.warn('No devices configured');
      return;
    }

    for (const device of this.config.devices) {
      const uuid = this.api.hap.uuid.generate(device.ipAddress ?? device.name ?? '');
      const existingAccessory = this.accessories.find(acc => acc.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        this.api.updatePlatformAccessories([existingAccessory]);
      } else {
        const accessory = new this.api.platformAccessory(device.name || 'Sky TV', uuid);
        accessory.context.device = device;
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.log.info('Added new accessory:', accessory.displayName);
      }
    }
  }
}
