/**
 * Photos of the sample products. They are hosted by Wikimedia Commons and published
 * under free licences, most of which require naming the author: the shop does that on
 * its "Nguồn hình ảnh" page, which reads this list.
 *
 * The photos show real devices of the same kind as the sample product, not the
 * product itself: AURA is a fictional brand.
 */
export type SampleImage = {
  url: string;
  title: string;
  author: string;
  license: string;
  /** The photo's page on Wikimedia Commons */
  source: string;
};

export const SAMPLE_IMAGES: Record<string, SampleImage[]> = {
  'prod-01': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.3.jpg/960px-Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.3',
      author: 'www.digitalpush.net',
      license: 'CC BY 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.3.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.4.jpg/960px-Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.4.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.4',
      author: 'www.digitalpush.net',
      license: 'CC BY 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.4.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.5.jpg/960px-Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.5.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.5',
      author: 'www.digitalpush.net',
      license: 'CC BY 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sony-WH-1000XM3-kabellose-Bluetooth-Noise-Cancelling-Kopfhoerer.5.jpg',
    },
  ],
  'prod-02': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Huawei_Smartwatch_Fit_2.jpg/960px-Huawei_Smartwatch_Fit_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Huawei Smartwatch Fit 2',
      author: 'D Eaketts',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Huawei_Smartwatch_Fit_2.jpg',
    },
  ],
  'prod-03': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Desk_Lamp_1_2013-07-12.jpg/960px-Desk_Lamp_1_2013-07-12.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Desk Lamp 1 2013-07-12',
      author: 'FASTILY',
      license: 'CC BY-SA 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Desk_Lamp_1_2013-07-12.jpg',
    },
  ],
  'prod-04': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Sonos_PLAY_1_wireless_speaker.jpg/960px-Sonos_PLAY_1_wireless_speaker.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sonos PLAY 1 wireless speaker',
      author: 'Robert Wetzlmayr',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sonos_PLAY_1_wireless_speaker.jpg',
    },
  ],
  'prod-05': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Mechanical_Keyboard.jpg/960px-Mechanical_Keyboard.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Mechanical Keyboard',
      author: 'SolarMainframe',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Mechanical_Keyboard.jpg',
    },
  ],
  'prod-06': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Delock_USB_m.2_NVMe_docking_station-oblique_FS_PNr%C2%B00912.jpg/960px-Delock_USB_m.2_NVMe_docking_station-oblique_FS_PNr%C2%B00912.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Delock USB m.2 NVMe docking station-oblique FS PNr°0912',
      author: 'D-Kuru',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Delock_USB_m.2_NVMe_docking_station-oblique_FS_PNr%C2%B00912.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Delock_USB_m.2_NVMe_docking_station-top_PNr%C2%B00913.jpg/960px-Delock_USB_m.2_NVMe_docking_station-top_PNr%C2%B00913.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Delock USB m.2 NVMe docking station-top PNr°0913',
      author: 'D-Kuru',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Delock_USB_m.2_NVMe_docking_station-top_PNr%C2%B00913.jpg',
    },
  ],
  'prod-07': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Office%2C_Standing_Desk_%285155525455%29.jpg/960px-Office%2C_Standing_Desk_%285155525455%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Office, Standing Desk (5155525455)',
      author: 'Ryan Snyder',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Office,_Standing_Desk_(5155525455).jpg',
    },
  ],
  'prod-08': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/ICATCH_IN-HB3201Z-P_20230818.jpg/960px-ICATCH_IN-HB3201Z-P_20230818.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'ICATCH IN-HB3201Z-P 20230818',
      author: 'Solomon203',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:ICATCH_IN-HB3201Z-P_20230818.jpg',
    },
  ],
  'prod-09': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Yamaha_TW-E3A_Earbuds_Customize%2C_Japan%3B_April_2021_%2801%29.jpg/960px-Yamaha_TW-E3A_Earbuds_Customize%2C_Japan%3B_April_2021_%2801%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Yamaha TW-E3A Earbuds Customize, Japan; April 2021 (01)',
      author: 'MIKI Yoshihito. (#mikiyoshihito)',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Yamaha_TW-E3A_Earbuds_Customize,_Japan;_April_2021_(01).jpg',
    },
  ],
  'prod-10': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/USB_power_adapter_for_Apple_iPod%2C_Model_A1205%2C_by_Foxlink_Technology_Ltd-1050.jpg/960px-USB_power_adapter_for_Apple_iPod%2C_Model_A1205%2C_by_Foxlink_Technology_Ltd-1050.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'USB power adapter for Apple iPod, Model A1205, by Foxlink Technology Ltd-1050',
      author: 'Raimond Spekking',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:USB_power_adapter_for_Apple_iPod,_Model_A1205,_by_Foxlink_Technology_Ltd-1050.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/USB_power_adapter_for_Apple_iPod%2C_Model_A1205%2C_by_Foxlink_Technology_Ltd-1048.jpg/960px-USB_power_adapter_for_Apple_iPod%2C_Model_A1205%2C_by_Foxlink_Technology_Ltd-1048.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'USB power adapter for Apple iPod, Model A1205, by Foxlink Technology Ltd-1048',
      author: 'Raimond Spekking',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:USB_power_adapter_for_Apple_iPod,_Model_A1205,_by_Foxlink_Technology_Ltd-1048.jpg',
    },
  ],
  'prod-11': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones.jpg/960px-Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Bose QuietComfort 25 Acoustic Noise Cancelling Headphones',
      author: 'Florian Fuchs',
      license: 'CC BY-SA 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones_with_Carry_Case.jpg/960px-Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones_with_Carry_Case.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Bose QuietComfort 25 Acoustic Noise Cancelling Headphones with Carry Case',
      author: 'Florian Fuchs',
      license: 'CC BY-SA 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones_with_Carry_Case.jpg',
    },
  ],
  'prod-12': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/2023_S%C5%82uchawki_Sony_WI-XB400_%281%29.jpg/960px-2023_S%C5%82uchawki_Sony_WI-XB400_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: '2023 Słuchawki Sony WI-XB400 (1)',
      author: 'Jacek Halicki',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:2023_S%C5%82uchawki_Sony_WI-XB400_(1).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/2023_S%C5%82uchawki_Sony_WI-XB400_%283%29.jpg/960px-2023_S%C5%82uchawki_Sony_WI-XB400_%283%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: '2023 Słuchawki Sony WI-XB400 (3)',
      author: 'Jacek Halicki',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:2023_S%C5%82uchawki_Sony_WI-XB400_(3).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/2023_S%C5%82uchawki_Sony_WI-XB400_%282%29.jpg/960px-2023_S%C5%82uchawki_Sony_WI-XB400_%282%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: '2023 Słuchawki Sony WI-XB400 (2)',
      author: 'Jacek Halicki',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:2023_S%C5%82uchawki_Sony_WI-XB400_(2).jpg',
    },
  ],
  'prod-13': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/JBL_GO2_Bluetooth_speaker%2C_waterproof%2C_size_of_cigarette_pack.jpg/960px-JBL_GO2_Bluetooth_speaker%2C_waterproof%2C_size_of_cigarette_pack.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'JBL GO2 Bluetooth speaker, waterproof, size of cigarette pack',
      author: 'Pittigrilli',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:JBL_GO2_Bluetooth_speaker,_waterproof,_size_of_cigarette_pack.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/JBL_GO2_Bluetooth_speaker_with_ports_covered_under_hatch.jpg/960px-JBL_GO2_Bluetooth_speaker_with_ports_covered_under_hatch.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'JBL GO2 Bluetooth speaker with ports covered under hatch',
      author: 'Pittigrilli',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:JBL_GO2_Bluetooth_speaker_with_ports_covered_under_hatch.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/JBL_GO2_Bluetooth_speaker_in_size_comparison_to_glasses.jpg/960px-JBL_GO2_Bluetooth_speaker_in_size_comparison_to_glasses.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'JBL GO2 Bluetooth speaker in size comparison to glasses',
      author: 'Pittigrilli',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:JBL_GO2_Bluetooth_speaker_in_size_comparison_to_glasses.jpg',
    },
  ],
  'prod-14': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/JBL_Flip_4.jpg/960px-JBL_Flip_4.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'JBL Flip 4',
      author: 'Freekhou5',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:JBL_Flip_4.jpg',
    },
  ],
  'prod-15': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/LG_LAS260B_Soundbar.jpg/960px-LG_LAS260B_Soundbar.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'LG LAS260B Soundbar',
      author: 'Santeri Viinamäki',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:LG_LAS260B_Soundbar.jpg',
    },
  ],
  'prod-16': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Samson_Go_Mic_Clip-On_USB_Mikrofon_04.jpg/960px-Samson_Go_Mic_Clip-On_USB_Mikrofon_04.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Samson Go Mic Clip-On USB Mikrofon 04',
      author: 'Rillke',
      license: 'CC BY-SA 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Samson_Go_Mic_Clip-On_USB_Mikrofon_04.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Samson_Go_Mic_Clip-On_USB_Mikrofon_07.jpg/960px-Samson_Go_Mic_Clip-On_USB_Mikrofon_07.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Samson Go Mic Clip-On USB Mikrofon 07',
      author: 'Rillke',
      license: 'CC BY-SA 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Samson_Go_Mic_Clip-On_USB_Mikrofon_07.jpg',
    },
  ],
  'prod-17': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Sound_BlasterX_H5_Gaming_Headset.jpg/960px-Sound_BlasterX_H5_Gaming_Headset.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sound BlasterX H5 Gaming Headset',
      author: 'Dinopkk',
      license: 'CC BY-SA 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sound_BlasterX_H5_Gaming_Headset.jpg',
    },
  ],
  'prod-18': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/HMV_Record_Player.jpg/960px-HMV_Record_Player.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'HMV Record Player',
      author: 'Amitbalani',
      license: 'CC0',
      source: 'https://commons.wikimedia.org/wiki/File:HMV_Record_Player.jpg',
    },
  ],
  'prod-19': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Samsung_Galaxy_Fit2.jpg/960px-Samsung_Galaxy_Fit2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Samsung Galaxy Fit2',
      author: 'Kulawik.pl',
      license: 'CC BY 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Fit2.jpg',
    },
  ],
  'prod-20': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Android_Wear_Smartwatch-_LG_G_Watch_%2815048721571%29.jpg/960px-Android_Wear_Smartwatch-_LG_G_Watch_%2815048721571%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Android Wear Smartwatch- LG G Watch (15048721571)',
      author: 'Maurizio Pesce from Milan, Italia',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Android_Wear_Smartwatch-_LG_G_Watch_(15048721571).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Android_Wear_Smartwatch-_LG_G_Watch_%2815051421752%29.jpg/960px-Android_Wear_Smartwatch-_LG_G_Watch_%2815051421752%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Android Wear Smartwatch- LG G Watch (15051421752)',
      author: 'Maurizio Pesce from Milan, Italia',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Android_Wear_Smartwatch-_LG_G_Watch_(15051421752).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Android_Wear_Smartwatch-_LG_G_Watch_%2815051774155%29.jpg/960px-Android_Wear_Smartwatch-_LG_G_Watch_%2815051774155%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Android Wear Smartwatch- LG G Watch (15051774155)',
      author: 'Maurizio Pesce from Milan, Italia',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Android_Wear_Smartwatch-_LG_G_Watch_(15051774155).jpg',
    },
  ],
  'prod-21': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Angled_view_of_a_fashion_wristwatch_with_purple_dial_and_leather_strap_02.jpg/960px-Angled_view_of_a_fashion_wristwatch_with_purple_dial_and_leather_strap_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Angled view of a fashion wristwatch with purple dial and leather strap 02',
      author: 'A S M Jobaer',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Angled_view_of_a_fashion_wristwatch_with_purple_dial_and_leather_strap_02.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Angled_view_of_a_fashion_wristwatch_with_purple_dial_and_leather_strap_01.jpg/960px-Angled_view_of_a_fashion_wristwatch_with_purple_dial_and_leather_strap_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Angled view of a fashion wristwatch with purple dial and leather strap 01',
      author: 'A S M Jobaer',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Angled_view_of_a_fashion_wristwatch_with_purple_dial_and_leather_strap_01.jpg',
    },
  ],
  'prod-22': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/Garmin_GPS_Watch_%284184448251%29.jpg/960px-Garmin_GPS_Watch_%284184448251%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Garmin GPS Watch (4184448251)',
      author: 'slgckgc',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Garmin_GPS_Watch_(4184448251).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/Garmin_GPS_Watch_%284185094864%29.jpg/960px-Garmin_GPS_Watch_%284185094864%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Garmin GPS Watch (4185094864)',
      author: 'slgckgc',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Garmin_GPS_Watch_(4185094864).jpg',
    },
  ],
  'prod-23': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Neyya_smart_ring.jpg/960px-Neyya_smart_ring.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Neyya smart ring',
      author: 'designmilk from USA',
      license: 'CC BY-SA 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Neyya_smart_ring.jpg',
    },
  ],
  'prod-24': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Four_watch_straps_from_stainless_steel.jpg/960px-Four_watch_straps_from_stainless_steel.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Four watch straps from stainless steel',
      author: 'Pittigrilli',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Four_watch_straps_from_stainless_steel.jpg',
    },
  ],
  'prod-25': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/A_wireless_computer_mouse.jpg/960px-A_wireless_computer_mouse.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'A wireless computer mouse',
      author: 'Pixloom',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:A_wireless_computer_mouse.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/A_black_wireless_computer_mouse.jpg/960px-A_black_wireless_computer_mouse.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'A black wireless computer mouse',
      author: 'Pixloom',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:A_black_wireless_computer_mouse.jpg',
    },
  ],
  'prod-26': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Sihoo_M57_mesh_office_chair_14.jpg/960px-Sihoo_M57_mesh_office_chair_14.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sihoo M57 mesh office chair 14',
      author: 'Waldyrious',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sihoo_M57_mesh_office_chair_14.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Sihoo_M57_mesh_office_chair_13.jpg/960px-Sihoo_M57_mesh_office_chair_13.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sihoo M57 mesh office chair 13',
      author: 'Waldyrious',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sihoo_M57_mesh_office_chair_13.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Sihoo_M57_mesh_office_chair_15.jpg/960px-Sihoo_M57_mesh_office_chair_15.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Sihoo M57 mesh office chair 15',
      author: 'Waldyrious',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Sihoo_M57_mesh_office_chair_15.jpg',
    },
  ],
  'prod-27': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Chlad%C3%ADc%C3%AD_podlo%C5%BEka_pod_notebook.jpg/960px-Chlad%C3%ADc%C3%AD_podlo%C5%BEka_pod_notebook.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Chladící podložka pod notebook',
      author: 'Powercooler',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Chlad%C3%ADc%C3%AD_podlo%C5%BEka_pod_notebook.jpg',
    },
  ],
  'prod-28': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/LG_L194WT-SF_LCD_monitor.jpg/960px-LG_L194WT-SF_LCD_monitor.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'LG L194WT-SF LCD monitor',
      author: 'florisla from Mechelen, Belgium',
      license: 'CC BY-SA 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:LG_L194WT-SF_LCD_monitor.jpg',
    },
  ],
  'prod-29': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/H340f0b4d8dc44bf1acf4fa675c7035660.jpg/960px-H340f0b4d8dc44bf1acf4fa675c7035660.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'H340f0b4d8dc44bf1acf4fa675c7035660',
      author: 'Solangetorrestsuchiya',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:H340f0b4d8dc44bf1acf4fa675c7035660.jpg',
    },
  ],
  'prod-30': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Ergonomic_mouse_pad_wrist_pillow.jpg/960px-Ergonomic_mouse_pad_wrist_pillow.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Ergonomic mouse pad wrist pillow',
      author: 'HartL69',
      license: 'Public domain',
      source: 'https://commons.wikimedia.org/wiki/File:Ergonomic_mouse_pad_wrist_pillow.jpg',
    },
  ],
  'prod-31': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Monitor_arm_stand_%281%29.jpg/960px-Monitor_arm_stand_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Monitor arm stand (1)',
      author: 'Ben Scholzen',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Monitor_arm_stand_(1).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Ultra-wide_display_with_VESA_arm_-_1.jpg/960px-Ultra-wide_display_with_VESA_arm_-_1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Ultra-wide display with VESA arm - 1',
      author: 'Kyu3a',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Ultra-wide_display_with_VESA_arm_-_1.jpg',
    },
  ],
  'prod-32': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Apple-wireless-keyboard.jpg/960px-Apple-wireless-keyboard.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Apple-wireless-keyboard',
      author: 'Marcin Wieclaw (Pc Site)',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Apple-wireless-keyboard.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Apple-wireless-keyboard-aluminum-2007.jpg/960px-Apple-wireless-keyboard-aluminum-2007.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Apple-wireless-keyboard-aluminum-2007',
      author: 'Roadmr',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Apple-wireless-keyboard-aluminum-2007.jpg',
    },
  ],
  'prod-33': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Schreibtisch_mit_Bankers_Lamp_2015.jpg/960px-Schreibtisch_mit_Bankers_Lamp_2015.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Schreibtisch mit Bankers Lamp 2015',
      author: 'VSchagow',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Schreibtisch_mit_Bankers_Lamp_2015.jpg',
    },
  ],
  'prod-34': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/SAMSUNG_BATTERY_PACK_%28POWER_BANK%29_EB-P4520.jpg/960px-SAMSUNG_BATTERY_PACK_%28POWER_BANK%29_EB-P4520.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'SAMSUNG BATTERY PACK (POWER BANK) EB-P4520',
      author: 'Dinkun Chen',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:SAMSUNG_BATTERY_PACK_(POWER_BANK)_EB-P4520.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/SAMSUNG_BATTERY_PACK_%28POWER_BANK%29_EB-P4520_%283%29.jpg/960px-SAMSUNG_BATTERY_PACK_%28POWER_BANK%29_EB-P4520_%283%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'SAMSUNG BATTERY PACK (POWER BANK) EB-P4520 (3)',
      author: 'Dinkun Chen',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:SAMSUNG_BATTERY_PACK_(POWER_BANK)_EB-P4520_(3).jpg',
    },
  ],
  'prod-35': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/USB-C_cable_2017_A.jpg/960px-USB-C_cable_2017_A.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'USB-C cable 2017 A',
      author: 'Fructibus',
      license: 'CC0',
      source: 'https://commons.wikimedia.org/wiki/File:USB-C_cable_2017_A.jpg',
    },
  ],
  'prod-36': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Gigaset_Wireless_Fast_Charger%2C_Winschoten_%282020%29_02.jpg/960px-Gigaset_Wireless_Fast_Charger%2C_Winschoten_%282020%29_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Gigaset Wireless Fast Charger, Winschoten (2020) 02',
      author: 'Donald Trung Quoc Don',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Gigaset_Wireless_Fast_Charger,_Winschoten_(2020)_02.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Gigaset_Wireless_Fast_Charger%2C_Winschoten_%282020%29_05.jpg/960px-Gigaset_Wireless_Fast_Charger%2C_Winschoten_%282020%29_05.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Gigaset Wireless Fast Charger, Winschoten (2020) 05',
      author: 'Donald Trung Quoc Don',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Gigaset_Wireless_Fast_Charger,_Winschoten_(2020)_05.jpg',
    },
  ],
  'prod-37': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/SanDisk_Extreme_Portable_SSD_1_TB_-_front_view.jpg/960px-SanDisk_Extreme_Portable_SSD_1_TB_-_front_view.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'SanDisk Extreme Portable SSD 1 TB - front view',
      author: 'ITEagle Europe - Sebastiaan Broekhoven',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:SanDisk_Extreme_Portable_SSD_1_TB_-_front_view.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/SanDisk_Extreme_Portable_SSD_1_TB_-_front_view_with_cable.jpg/960px-SanDisk_Extreme_Portable_SSD_1_TB_-_front_view_with_cable.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'SanDisk Extreme Portable SSD 1 TB - front view with cable',
      author: 'ITEagle Europe - Sebastiaan Broekhoven',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:SanDisk_Extreme_Portable_SSD_1_TB_-_front_view_with_cable.jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/SanDisk_Extreme_Portable_SSD_1_TB_-_rear_view.jpg/960px-SanDisk_Extreme_Portable_SSD_1_TB_-_rear_view.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'SanDisk Extreme Portable SSD 1 TB - rear view',
      author: 'ITEagle Europe - Sebastiaan Broekhoven',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:SanDisk_Extreme_Portable_SSD_1_TB_-_rear_view.jpg',
    },
  ],
  'prod-38': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Wikimedia_swag_backpack.jpg/960px-Wikimedia_swag_backpack.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Wikimedia swag backpack',
      author: 'Kaartic',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Wikimedia_swag_backpack.jpg',
    },
  ],
  'prod-39': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/Cozistyle_Stand_Sleeve.jpg/960px-Cozistyle_Stand_Sleeve.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Cozistyle Stand Sleeve',
      author: 'Richardinsky',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Cozistyle_Stand_Sleeve.jpg',
    },
  ],
  'prod-40': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Webcam_%28Logitech_c922%29.jpg/960px-Webcam_%28Logitech_c922%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Webcam (Logitech c922)',
      author: 'Zsinytwiki',
      license: 'CC0',
      source: 'https://commons.wikimedia.org/wiki/File:Webcam_(Logitech_c922).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Webcam_01.jpg/960px-Webcam_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Webcam 01',
      author: 'Pmwiki1',
      license: 'CC0',
      source: 'https://commons.wikimedia.org/wiki/File:Webcam_01.jpg',
    },
  ],
  'prod-41': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Robot_Vacuum_%26_Mop_Combo_by_Xiaomi_Lydsto_with_Self_Emptying_Dock_and_LIDAR_Radar_Navigation_%2851262170433%29.jpg/960px-Robot_Vacuum_%26_Mop_Combo_by_Xiaomi_Lydsto_with_Self_Emptying_Dock_and_LIDAR_Radar_Navigation_%2851262170433%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Robot Vacuum & Mop Combo by Xiaomi Lydsto with Self Emptying Dock and LIDAR Radar Navigation (51262170433)',
      author: 'Smart Home Perfected',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Robot_Vacuum_%26_Mop_Combo_by_Xiaomi_Lydsto_with_Self_Emptying_Dock_and_LIDAR_Radar_Navigation_(51262170433).jpg',
    },
  ],
  'prod-42': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Air_Purifier_%28Levoit_LV-H133%29_%2849317867758%29.jpg/960px-Air_Purifier_%28Levoit_LV-H133%29_%2849317867758%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Air Purifier (Levoit LV-H133) (49317867758)',
      author: 'Home Air Quality Guides',
      license: 'CC BY-SA 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Air_Purifier_(Levoit_LV-H133)_(49317867758).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Air_Purifier_%28Levoit_LV-H133%29_%2849318569587%29.jpg/960px-Air_Purifier_%28Levoit_LV-H133%29_%2849318569587%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Air Purifier (Levoit LV-H133) (49318569587)',
      author: 'Home Air Quality Guides',
      license: 'CC BY-SA 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Air_Purifier_(Levoit_LV-H133)_(49318569587).jpg',
    },
  ],
  'prod-43': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Philips_Hue_white_bulb_-_June_2018_%281944%29.jpg/960px-Philips_Hue_white_bulb_-_June_2018_%281944%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Philips Hue white bulb - June 2018 (1944)',
      author: 'Gregory Varnum',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Philips_Hue_white_bulb_-_June_2018_(1944).jpg',
    },
  ],
  'prod-44': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Wemo_Mini_Smart_Plug_%283755%29.jpg/960px-Wemo_Mini_Smart_Plug_%283755%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Wemo Mini Smart Plug (3755)',
      author: 'Gregory Varnum',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Wemo_Mini_Smart_Plug_(3755).jpg',
    },
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Wemo_Mini_Smart_Plug_%283750%29.jpg/960px-Wemo_Mini_Smart_Plug_%283750%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Wemo Mini Smart Plug (3750)',
      author: 'Gregory Varnum',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Wemo_Mini_Smart_Plug_(3750).jpg',
    },
  ],
  'prod-45': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Wireless_Arlo_video_doorbell.jpg/960px-Wireless_Arlo_video_doorbell.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Wireless Arlo video doorbell',
      author: 'SalariéVerisure',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Wireless_Arlo_video_doorbell.jpg',
    },
  ],
  'prod-46': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Nuki_Smart_Lock.jpg/960px-Nuki_Smart_Lock.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Nuki Smart Lock',
      author: 'Nuki Smart Lock (Flickr User)',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Nuki_Smart_Lock.jpg',
    },
  ],
  'prod-47': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Lelit_Semiautomatic_Espresso_Machine_with_PID_and_Pressure_Gauge.jpg/960px-Lelit_Semiautomatic_Espresso_Machine_with_PID_and_Pressure_Gauge.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Lelit Semiautomatic Espresso Machine with PID and Pressure Gauge',
      author: 'massage-techniques',
      license: 'CC BY-SA 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Lelit_Semiautomatic_Espresso_Machine_with_PID_and_Pressure_Gauge.jpg',
    },
  ],
  'prod-48': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Humidifier_%2851260595296%29.jpg/960px-Humidifier_%2851260595296%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Humidifier (51260595296)',
      author: 'ajay_suresh',
      license: 'CC BY 2.0',
      source: 'https://commons.wikimedia.org/wiki/File:Humidifier_(51260595296).jpg',
    },
  ],
  'prod-49': [
    {
      url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Electric_water_boiler_2014.JPG/960px-Electric_water_boiler_2014.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
      title: 'Electric water boiler 2014',
      author: 'Lesekreis',
      license: 'CC0',
      source: 'https://commons.wikimedia.org/wiki/File:Electric_water_boiler_2014.JPG',
    },
  ],
};
