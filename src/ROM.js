/**
 * TODO: make cartridge class?
 */
function ROM(arrayBuffer) {
  this.parent = GenericMemory;
  this.parent.call(this, arrayBuffer);
  this.header = new ROMHeader(this);
  this.chrrom = null;
  this.mapper = this._generateMapper();
  this._initCHRROM(this.mapper);
};
__inherit(ROM, GenericMemory);

ROM.prototype._HEADER_SIZE = 16; // 16bytes


ROM.prototype._init = function() {
};


/**
 * TODO: temporal. for NROM with CHRROM.
 */
ROM.prototype._initCHRROM = function(mapper) {
  if(this.hasCHRROM()) {
    var capacity = 16 * 1024 * this.header.getCHRROMBanksNum();
    var offset = this.header.getPRGROMBanksNum() * 0x4000 + this._HEADER_SIZE;
    this.chrrom = new CHRROM(capacity, mapper);
    for(var i = 0; i < capacity; i++) {
      var value = this.loadWithoutMapping(i + offset);
      this.chrrom.storeWithoutMapping(i, value);
    }
  }
};


ROM.prototype.load = function(address) {
  return this.uint8[this.mapper.map(address) + this._HEADER_SIZE];
};


/**
 * TODO: temporal. add description later.
 */
ROM.prototype.store = function(address, value) {
  this.mapper.store(address, value);
};


/**
 * TODO: temporal
 */
ROM.prototype._generateMapper = function() {
  switch(this.header.getMapperNum()) {
    case 0:
      return new NROMMapper(this);
    case 1:
      return new MMC1Mapper(this);
    case 2:
      return new UNROMMapper(this);
    case 76:
      return new Mapper76(this);
    default:
      window.alert('unsupport No.' + this.header.getMapperNum() + ' Mapper');
      throw new Error('unsupport No.' + this.header.getMapperNum() + ' Mapper');
  }
};


ROM.prototype.isNES = function() {
  return this.header.isNES();
};


/**
 * TODO: temporal. for NROM.
 */
ROM.prototype.hasCHRROM = function() {
  return this.header.getCHRROMBanksNum() > 0;
};


ROM.prototype.dumpHeader = function() {
  return this.header.dump();
};


ROM.prototype._getStartDumpAddress = function() {
  return this._HEADER_SIZE;
};


/**
 * TODO: temporal. for NROM.
 */
ROM.prototype._getEndDumpAddress = function() {
  return 0x4000 + this._HEADER_SIZE;
};



function ROMHeader(rom) {
  this.rom = rom;
};

ROMHeader.prototype._WORD_SIZE = 1; // 1byte

ROMHeader.prototype._SIGNATURE = 'NES';
ROMHeader.prototype._SIGNATURE_ADDRESS = 0;
ROMHeader.prototype._SIGNATURE_SIZE = ROMHeader.prototype._SIGNATURE.length;

ROMHeader.prototype._MAGIC_NUMBER = 0x1a;
ROMHeader.prototype._MAGIC_NUMBER_ADDRESS = 3;
ROMHeader.prototype._MAGIC_NUMBER_SIZE = 1;

ROMHeader.prototype._PRG_ROM_BANKS_NUM_ADDRESS = 4;
ROMHeader.prototype._PRG_ROM_BANKS_NUM_SIZE = 1;

ROMHeader.prototype._CHR_ROM_BANKS_NUM_ADDRESS = 5;
ROMHeader.prototype._CHR_ROM_BANKS_NUM_SIZE = 1;

ROMHeader.prototype._CONTROL_BYTE1_ADDRESS = 6;
ROMHeader.prototype._CONTROL_BYTE1_SIZE = 1;

ROMHeader.prototype._CONTROL_BYTE2_ADDRESS = 7;
ROMHeader.prototype._CONTROL_BYTE2_SIZE = 1;

ROMHeader.prototype._RAM_BANKS_NUM_ADDRESS = 8;
ROMHeader.prototype._RAM_BANKS_NUM_SIZE = 1;

ROMHeader.prototype._UNUSED_ADDRESS = 9;
ROMHeader.prototype._UNUSED_SIZE = 7;

ROMHeader.prototype._MIRRORING_TYPE_BIT = 0;
ROMHeader.prototype._MIRRORING_TYPE_BITS_MASK = 0x1;
ROMHeader.prototype._MIRRORING_TYPE_HORIZONTAL = 0;
ROMHeader.prototype._MIRRORING_TYPE_VERTICAL = 1;

ROMHeader.prototype._BATTERY_BACKED_RAM_BIT = 1;
ROMHeader.prototype._BATTERY_BACKED_RAM_BITS_MASK = 0x1;

ROMHeader.prototype._512BYTES_TRAINER_BIT = 2;
ROMHeader.prototype._512BYTES_TRAINER_BITS_MASK = 0x1;

ROMHeader.prototype._FOUR_SCREEN_MIRRORING_BIT = 3;
ROMHeader.prototype._FOUR_SCREEN_MIRRORING_BITS_MASK = 0x1;

ROMHeader.prototype._MAPPER_LOWER_BIT = 4;
ROMHeader.prototype._MAPPER_LOWER_BITS_SIZE = 4; // 4bits
ROMHeader.prototype._MAPPER_LOWER_BITS_MASK = 0xf;

ROMHeader.prototype._MAPPER_HIGHER_BIT = 4;
ROMHeader.prototype._MAPPER_HIGHER_BITS_SIZE = 4; // 4bits
ROMHeader.prototype._MAPPER_HIGHER_BITS_MASK = 0xf;

// TODO: consider to extract mapper class.
// TODO: not fixed yet.
ROMHeader.prototype._MAPPERS = [];
ROMHeader.prototype._MAPPERS[0] = {'name': 'NROM'};
ROMHeader.prototype._MAPPERS[1] = {'name': 'MMC1'};
ROMHeader.prototype._MAPPERS[2] = {'name': 'UNROM'};
ROMHeader.prototype._MAPPERS[3] = {'name': 'CNROM'};
ROMHeader.prototype._MAPPERS[4] = {'name': 'MMC3'};
ROMHeader.prototype._MAPPERS[76] = {'name': 'Namco'};


ROMHeader.prototype.load = function(address) {
  return this.rom.loadWithoutMapping(address);
};


ROMHeader.prototype.getSignature = function() {
  var str = '';
  for(var i = 0; i < this._SIGNATURE_SIZE; i++) {
    str += String.fromCharCode(this.load(this._SIGNATURE_ADDRESS+i));
  }
  return str;
};


ROMHeader.prototype.getMagicNumber = function() {
  return this.load(this._MAGIC_NUMBER_ADDRESS);
};


ROMHeader.prototype.getPRGROMBanksNum = function() {
  return this.load(this._PRG_ROM_BANKS_NUM_ADDRESS);
};


ROMHeader.prototype.getCHRROMBanksNum = function() {
  return this.load(this._CHR_ROM_BANKS_NUM_ADDRESS);
};


ROMHeader.prototype.getControlByte1 = function() {
  return this.load(this._CONTROL_BYTE1_ADDRESS);
};


ROMHeader.prototype.getControlByte2 = function() {
  return this.load(this._CONTROL_BYTE2_ADDRESS);
};


ROMHeader.prototype.getRAMBanksNum = function() {
  return this.load(this._RAM_BANKS_NUM_ADDRESS);
};


ROMHeader.prototype.getUnusedField = function() {
  var value = 0;
  for(var i = 0; i < this._UNUSED_SIZE; i++) {
    value = (value << 8) | this.load(this._UNUSED_ADDRESS+i);
  }
  return value;
};


/**
 * assumes value is Word size(1byte) data.
 */
ROMHeader.prototype._getPartialBits = function(value, bit, mask) {
  return (value >> bit) & mask;
};


ROMHeader.prototype.getMirroringType = function() {
  return this._getPartialBits(this.getControlByte1(),
                              this._MIRRORING_TYPE_BIT,
                              this._MIRRORING_TYPE_BITS_MASK);
};


ROMHeader.prototype.getMirroringTypeAsStrings = function() {
  return (this.getMirroringType() == this._MIRRORING_TYPE_HORIZONTAL)
           ? 'horizontal' : 'vertical';
};


ROMHeader.prototype.getBatteryBackedRAM = function() {
  return this._getPartialBits(this.getControlByte1(),
                              this._BATTERY_BACKED_RAM_BIT,
                              this._BATTERY_BACKED_RAM_BITS_MASK);
};


ROMHeader.prototype.get512BytesTrainer = function() {
  return this._getPartialBits(this.getControlByte1(),
                              this._512BYTES_TRAINER_BIT,
                              this._512BYTES_TRAINER_BITS_MASK);
};


ROMHeader.prototype.getFourScreenMirroring = function() {
  return this._getPartialBits(this.getControlByte1(),
                              this._FOUR_SCREEN_MIRRORING_BIT,
                              this._FOUR_SCREEN_MIRRORING_BITS_MASK);
};


ROMHeader.prototype.getMapperNum = function() {
  var lowerBits = this._getPartialBits(this.getControlByte1(),
                                       this._MAPPER_LOWER_BIT,
                                       this._MAPPER_LOWER_BITS_MASK);
  var higherBits = this._getPartialBits(this.getControlByte2(),
                                        this._MAPPER_HIGHER_BIT,
                                        this._MAPPER_HIGHER_BITS_MASK);
  return (higherBits << this._MAPPER_LOWER_BITS_SIZE) | lowerBits;
};


ROMHeader.prototype.getMapperName = function() {
  var num = this.getMapperNum();
  if(this._MAPPERS[num])
    return this._MAPPERS[num].name;
  else
    return 'invalid or not implemented yet.';
};


ROMHeader.prototype.isNES = function() {
  if(this._SIGNATURE != this.getSignature())
    return false;
  if(this.getMagicNumber() != this._MAGIC_NUMBER)
    return false;
  return true;
};


ROMHeader.prototype.dump = function() {
  var buffer = '';

  buffer += '0x ';
  for(var i = 0; i < ROM.prototype._HEADER_SIZE; i++) {
    buffer += __10to16(this.load(i), 2, true) + ' ';
  }
  buffer += '\n\n';

  buffer += 'Signature: ' + this.getSignature() + '\n';
  buffer += 'Magic Number: ' + __10to16(this.getMagicNumber(), 2) + '\n';
  buffer += 'PRG-ROM banks num: ' +
              __10to16(this.getPRGROMBanksNum(), 2) + '\n';
  buffer += 'CHR-ROM banks num: ' +
              __10to16(this.getCHRROMBanksNum(), 2) + '\n';
  buffer += 'Control1: ' + __10to16(this.getControlByte1(), 2) + '\n';
  buffer += 'Control2: ' + __10to16(this.getControlByte2(), 2) + '\n';
  buffer += 'RAM banks num: ' + __10to16(this.getRAMBanksNum(), 2) + '\n';
  buffer += 'Unused field: ' + __10to16(this.getUnusedField(), 14) + '\n';
  buffer += '\n';
  buffer += 'In control bytes\n';
  buffer += 'Mirroring type: ' + __10to16(this.getMirroringType()) +
              '(' + this.getMirroringTypeAsStrings() + ')\n';
  buffer += 'Battery-backed RAM: ' +
               __10to16(this.getBatteryBackedRAM()) + '\n';
  buffer += '512-byte trainer: ' +
              __10to16(this.get512BytesTrainer()) + '\n';
  buffer += 'Four screen mirroring: ' +
               __10to16(this.getFourScreenMirroring()) + '\n';
  buffer += 'Mapper number: ' + __10to16(this.getMapperNum(), 2) +
              '(' + this.getMapperName() + ')';
  return buffer;
};



function CHRROM(capacity, mapper) {
  this.parent = GenericMemory;
  this.parent.call(this, capacity);
  this.mapper = mapper;
};
__inherit(CHRROM, GenericMemory);


CHRROM.prototype.load = function(address) {
  return this.uint8[this.mapper.mapForCHRROM(address)];
};


CHRROM.prototype.store = function(address, value) {
};



function ROMMapper(rom) {
  this.rom = rom;
};


ROMMapper.prototype.map = function(address) {
  return address;
};


ROMMapper.prototype.mapForCHRROM = function(address) {
  return address;
};


ROMMapper.prototype.store = function(address, value) {
};



function NROMMapper(rom) {
  this.parent = ROMMapper;
  this.parent.call(this, rom);
  this.prgNum = rom.header.getPRGROMBanksNum();
};
__inherit(NROMMapper, ROMMapper);


NROMMapper.prototype.map = function(address) {
  if(this.prgNum == 1 && address >= 0x4000)
    address -= 0x4000;
  return address;
};



function UNROMMapper(rom) {
  this.parent = ROMMapper;
  this.parent.call(this, rom);
  this.reg = new Register();
};
__inherit(UNROMMapper, ROMMapper);


/**
 * TODO: temporal
 */
UNROMMapper.prototype.map = function(address) {
  var bank = (address < 0x4000) ? this.reg.load() : 7;
  var offset = address & 0x3fff;
  return 1024 * 16 * bank + offset;
};


UNROMMapper.prototype.store = function(address, value) {
  this.reg.store(value & 0x7);
};



function MMC1Mapper(rom) {
  this.parent = ROMMapper;
  this.parent.call(this, rom);
  this.tmpReg = new Register();
  this.reg0 = new Register();
  this.reg1 = new Register();
  this.reg2 = new Register();
  this.reg3 = new Register();
  this.tmpWriteCount = 0;
  this.prgNum = this.rom.header.getPRGROMBanksNum();
  this.reg0.store(0x0C);
};
__inherit(MMC1Mapper, ROMMapper);


MMC1Mapper.prototype.map = function(address) {
  var bank;
  var offset;
  if(this.reg0.loadBit(3)) {
    offset = address & 0x3FFF;
    if(this.reg0.loadBit(2)) {
      bank = (address < 0x4000) ? this.reg3.load() & 0x0f : this.prgNum-1;
    } else {
      bank = (address < 0x4000) ? 0 : this.reg3.load() & 0x0f;
    }
  } else {
    offset = address & 0x7FFF;
    bank = this.reg3.load() & 0x0f;
  }
  return bank * 0x4000 + offset;
};


MMC1Mapper.prototype.mapForCHRROM = function(address) {
  var bank;
  var offset;
  if(this.reg0.loadBit(4)) {
    bank = ((address < 0x1000) ? this.reg1.load() : this.reg2.load()) & 0xf;
    offset = address & 0x0FFF;
  } else {
    bank = (this.reg1.load() & 0xf) * 2;
    offset = address & 0x1FFF;
  }
  return bank * 0x1000 + offset;
};


MMC1Mapper.prototype.store = function(address, value) {
  if(value & 0x80) {
    this.tmpWriteCount = 0;
    this.tmpReg.store(0);
    switch(address & 0x6000) {
      case 0x0000:
        this.reg0.store(0x0C);
        break;
      case 0x2000:
        this.reg1.store(0x00);
        break;
      case 0x4000:
        this.reg2.store(0x00);
        break;
      case 0x6000:
        this.reg3.store(0x00);
        break;
      default:
        // throw exception?
        break;
    }
  } else {
    this.tmpReg.storeBit(this.tmpWriteCount, value & 1);
    this.tmpWriteCount++;
    if(this.tmpWriteCount >= 5) {
      var val = this.tmpReg.load();
      switch(address & 0x6000) {
        case 0x0000:
          this.reg0.store(val);
          break;
        case 0x2000:
          this.reg1.store(val);
          break;
        case 0x4000:
          this.reg2.store(val);
          break;
        case 0x6000:
          this.reg3.store(val);
          break;
        default:
          // throw exception?
          break;
      }
      this.tmpWriteCount = 0;
      this.tmpReg.store(0);
    }
  }
};



function Mapper76(rom) {
  this.parent = ROMMapper;
  this.parent.call(this, rom);
  this.addrReg = new Register();
  this.chrReg0 = new Register();
  this.chrReg1 = new Register();
  this.chrReg2 = new Register();
  this.chrReg3 = new Register();
  this.prgReg0 = new Register();
  this.prgReg1 = new Register();
  this.prgNum = this.rom.header.getPRGROMBanksNum();
};
__inherit(Mapper76, ROMMapper);


Mapper76.prototype.map = function(address) {
  var bank;
  var offset = address & 0x1FFF;
  switch(address & 0x6000) {
    case 0x0000:
      bank = this.prgReg0.load();
      break;
    case 0x2000:
      bank = this.prgReg1.load();
      break;
    case 0x4000:
      bank = this.prgNum - 2;
      break;
    case 0x6000:
      bank = this.prgNum - 1;
      break;
  }
  return bank * 0x2000 + offset;
};


Mapper76.prototype.mapForCHRROM = function(address) {
  var bank;
  var offset = address & 0x7FF;
  switch(address & 0x1800) {
    case 0x0000:
      bank = this.chrReg0.load();
      break;
    case 0x0800:
      bank = this.chrReg1.load();
      break;
    case 0x1000:
      bank = this.chrReg2.load();
      break;
    case 0x1800:
      bank = this.chrReg3.load();
      break;
  }
  return bank * 0x800 + offset;
};


Mapper76.prototype.store = function(address, value) {
  if(address == 1) {
    var reg;
    switch(this.addrReg.load()) {
      case 0:
      case 1:
        return;
      case 2:
        reg = this.chrReg0;
        break;
      case 3:
        reg = this.chrReg1;
        break;
      case 4:
        reg = this.chrReg2;
        break;
      case 5:
        reg = this.chrReg3;
        break;
      case 6:
        reg = this.prgReg0;
        break;
      case 7:
        reg = this.prgReg1;
        break;
    }
    reg.store(value & 0x3F);
  } else {
    this.addrReg.store(value & 7);
  }
};

