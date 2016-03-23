/**
 * Ricoh 6502
 * TODO: consider if setROM method is necessary.
 */
function CPU() {
  this.pc = new Register16bit();
  this.sp = new Register();
  this.a = new Register();
  this.x = new Register();
  this.y = new Register();
  this.p = new CPUStatusRegister();
  this.ram = new RAM();
  this.pad1 = null; // set by setJoypad1()
  this.ppu = null;
  this.rom = null;
  this.handling = 0;
};

CPU.prototype._INTERRUPT_NMI = 0;
CPU.prototype._INTERRUPT_RESET = 1;
CPU.prototype._INTERRUPT_IRQ = 2;

CPU.prototype._INTERRUPT_HANDLER_ADDRESSES = [];
CPU.prototype._INTERRUPT_HANDLER_ADDRESSES[CPU.prototype._INTERRUPT_NMI] = 0xFFFA;
CPU.prototype._INTERRUPT_HANDLER_ADDRESSES[CPU.prototype._INTERRUPT_RESET] = 0xFFFC;
CPU.prototype._INTERRUPT_HANDLER_ADDRESSES[CPU.prototype._INTERRUPT_IRQ] = 0xFFFE;

CPU.prototype._OP_INV = {'opc':  0, 'name': 'inv'}; // Invalid
CPU.prototype._OP_ADC = {'opc':  1, 'name': 'adc'};
CPU.prototype._OP_AND = {'opc':  2, 'name': 'and'};
CPU.prototype._OP_ASL = {'opc':  3, 'name': 'asl'};
CPU.prototype._OP_BCC = {'opc':  4, 'name': 'bcc'};
CPU.prototype._OP_BCS = {'opc':  5, 'name': 'bcs'};
CPU.prototype._OP_BEQ = {'opc':  6, 'name': 'beq'};
CPU.prototype._OP_BIT = {'opc':  7, 'name': 'bit'};
CPU.prototype._OP_BMI = {'opc':  8, 'name': 'bmi'};
CPU.prototype._OP_BNE = {'opc':  9, 'name': 'bne'};
CPU.prototype._OP_BPL = {'opc': 10, 'name': 'bpl'};
CPU.prototype._OP_BRK = {'opc': 11, 'name': 'brk'};
CPU.prototype._OP_BVC = {'opc': 12, 'name': 'bvc'};
CPU.prototype._OP_BVS = {'opc': 13, 'name': 'bvs'};
CPU.prototype._OP_CLC = {'opc': 14, 'name': 'clc'};
CPU.prototype._OP_CLD = {'opc': 15, 'name': 'cld'};
CPU.prototype._OP_CLI = {'opc': 16, 'name': 'cli'};
CPU.prototype._OP_CLV = {'opc': 17, 'name': 'clv'};
CPU.prototype._OP_CMP = {'opc': 18, 'name': 'cmp'};
CPU.prototype._OP_CPX = {'opc': 19, 'name': 'cpx'};
CPU.prototype._OP_CPY = {'opc': 20, 'name': 'cpy'};
CPU.prototype._OP_DEC = {'opc': 21, 'name': 'dec'};
CPU.prototype._OP_DEX = {'opc': 22, 'name': 'dex'};
CPU.prototype._OP_DEY = {'opc': 23, 'name': 'dey'};
CPU.prototype._OP_EOR = {'opc': 24, 'name': 'eor'};
CPU.prototype._OP_INC = {'opc': 25, 'name': 'inc'};
CPU.prototype._OP_INX = {'opc': 26, 'name': 'inx'};
CPU.prototype._OP_INY = {'opc': 27, 'name': 'iny'};
CPU.prototype._OP_JMP = {'opc': 28, 'name': 'jmp'};
CPU.prototype._OP_JSR = {'opc': 29, 'name': 'jsr'};
CPU.prototype._OP_LDA = {'opc': 30, 'name': 'lda'};
CPU.prototype._OP_LDX = {'opc': 31, 'name': 'ldx'};
CPU.prototype._OP_LDY = {'opc': 32, 'name': 'ldy'};
CPU.prototype._OP_LSR = {'opc': 33, 'name': 'lsr'};
CPU.prototype._OP_NOP = {'opc': 34, 'name': 'nop'};
CPU.prototype._OP_ORA = {'opc': 35, 'name': 'ora'};
CPU.prototype._OP_PHA = {'opc': 36, 'name': 'pha'};
CPU.prototype._OP_PHP = {'opc': 37, 'name': 'php'};
CPU.prototype._OP_PLA = {'opc': 38, 'name': 'pla'};
CPU.prototype._OP_PLP = {'opc': 39, 'name': 'plp'};
CPU.prototype._OP_ROL = {'opc': 40, 'name': 'rol'};
CPU.prototype._OP_ROR = {'opc': 41, 'name': 'ror'};
CPU.prototype._OP_RTI = {'opc': 42, 'name': 'rti'};
CPU.prototype._OP_RTS = {'opc': 43, 'name': 'rts'};
CPU.prototype._OP_SBC = {'opc': 44, 'name': 'sbc'};
CPU.prototype._OP_SEC = {'opc': 45, 'name': 'sec'};
CPU.prototype._OP_SED = {'opc': 46, 'name': 'sed'};
CPU.prototype._OP_SEI = {'opc': 47, 'name': 'sei'};
CPU.prototype._OP_STA = {'opc': 48, 'name': 'sta'};
CPU.prototype._OP_STX = {'opc': 49, 'name': 'stx'};
CPU.prototype._OP_STY = {'opc': 50, 'name': 'sty'};
CPU.prototype._OP_TAX = {'opc': 51, 'name': 'tax'};
CPU.prototype._OP_TAY = {'opc': 52, 'name': 'tay'};
CPU.prototype._OP_TSX = {'opc': 53, 'name': 'tsx'};
CPU.prototype._OP_TXA = {'opc': 54, 'name': 'txa'};
CPU.prototype._OP_TXS = {'opc': 55, 'name': 'txs'};
CPU.prototype._OP_TYA = {'opc': 56, 'name': 'tya'};

// TODO: not fixed yet.
CPU.prototype._ADDRESSING_IMMEDIATE           = {'id':  0, 'pc': 2, 'name': 'immediate'};
CPU.prototype._ADDRESSING_ABSOLUTE            = {'id':  1, 'pc': 3, 'name': 'absolute'};
CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X  = {'id':  2, 'pc': 3, 'name': 'indexed_absolute_x'};
CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y  = {'id':  3, 'pc': 3, 'name': 'indexed_absolute_y'};
CPU.prototype._ADDRESSING_ZERO_PAGE           = {'id':  4, 'pc': 2, 'name': 'zero_page'};
CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X = {'id':  5, 'pc': 2, 'name': 'indexed_zero_page_x'};
CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_Y = {'id':  6, 'pc': 2, 'name': 'indexed_zero_page_y'};
CPU.prototype._ADDRESSING_IMPLIED             = {'id':  7, 'pc': 1, 'name': 'implied'};
CPU.prototype._ADDRESSING_ACCUMULATOR         = {'id':  8, 'pc': 1, 'name': 'accumulator'};
CPU.prototype._ADDRESSING_INDIRECT            = {'id':  9, 'pc': 3, 'name': 'indirect'};
CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X  = {'id': 10, 'pc': 2, 'name': 'indexed_indirect_x'};
CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y  = {'id': 11, 'pc': 2, 'name': 'indexed_indirect_y'};
CPU.prototype._ADDRESSING_RELATIVE            = {'id': 12, 'pc': 2, 'name': 'relative'};

// decodes in advance cuz it's much easier than implementing decoder.
// be careful that some 6502 related documents include some mistakes.
// TODO: validation.
// TODO: opzimization. each line is long.
CPU.prototype._OP = [];
CPU.prototype._OP[0x00] = {'op': CPU.prototype._OP_BRK, 'cycle': 7, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x01] = {'op': CPU.prototype._OP_ORA, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0x02] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x03] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x04] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x05] = {'op': CPU.prototype._OP_ORA, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x06] = {'op': CPU.prototype._OP_ASL, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x07] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x08] = {'op': CPU.prototype._OP_PHP, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x09] = {'op': CPU.prototype._OP_ORA, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0x0A] = {'op': CPU.prototype._OP_ASL, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_ACCUMULATOR};
CPU.prototype._OP[0x0B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x0C] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x0D] = {'op': CPU.prototype._OP_ORA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x0E] = {'op': CPU.prototype._OP_ASL, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x0F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x10] = {'op': CPU.prototype._OP_BPL, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0x11] = {'op': CPU.prototype._OP_ORA, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0x12] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x13] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x14] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x15] = {'op': CPU.prototype._OP_ORA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x16] = {'op': CPU.prototype._OP_ASL, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x17] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x18] = {'op': CPU.prototype._OP_CLC, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x19] = {'op': CPU.prototype._OP_ORA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0x1A] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x1B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x1C] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x1D] = {'op': CPU.prototype._OP_ORA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x1E] = {'op': CPU.prototype._OP_ASL, 'cycle': 7, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x1F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x20] = {'op': CPU.prototype._OP_JSR, 'cycle': 0, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x21] = {'op': CPU.prototype._OP_AND, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0x22] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x23] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x24] = {'op': CPU.prototype._OP_BIT, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x25] = {'op': CPU.prototype._OP_AND, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x26] = {'op': CPU.prototype._OP_ROL, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x27] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x28] = {'op': CPU.prototype._OP_PLP, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x29] = {'op': CPU.prototype._OP_AND, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0x2A] = {'op': CPU.prototype._OP_ROL, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_ACCUMULATOR};
CPU.prototype._OP[0x2B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x2C] = {'op': CPU.prototype._OP_BIT, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x2D] = {'op': CPU.prototype._OP_AND, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x2E] = {'op': CPU.prototype._OP_ROL, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x2F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x30] = {'op': CPU.prototype._OP_BMI, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0x31] = {'op': CPU.prototype._OP_AND, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0x32] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x33] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x34] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x35] = {'op': CPU.prototype._OP_AND, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x36] = {'op': CPU.prototype._OP_ROL, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x37] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x38] = {'op': CPU.prototype._OP_SEC, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x39] = {'op': CPU.prototype._OP_AND, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0x3A] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x3B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x3C] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x3D] = {'op': CPU.prototype._OP_AND, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x3E] = {'op': CPU.prototype._OP_ROL, 'cycle': 7, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x3F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x40] = {'op': CPU.prototype._OP_RTI, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x41] = {'op': CPU.prototype._OP_EOR, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0x42] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x43] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x44] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x45] = {'op': CPU.prototype._OP_EOR, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x46] = {'op': CPU.prototype._OP_LSR, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x47] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x48] = {'op': CPU.prototype._OP_PHA, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x49] = {'op': CPU.prototype._OP_EOR, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0x4A] = {'op': CPU.prototype._OP_LSR, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_ACCUMULATOR};
CPU.prototype._OP[0x4B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x4C] = {'op': CPU.prototype._OP_JMP, 'cycle': 0, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x4D] = {'op': CPU.prototype._OP_EOR, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x4E] = {'op': CPU.prototype._OP_LSR, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x4F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x50] = {'op': CPU.prototype._OP_BVC, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0x51] = {'op': CPU.prototype._OP_EOR, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0x52] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x53] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x54] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x55] = {'op': CPU.prototype._OP_EOR, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x56] = {'op': CPU.prototype._OP_LSR, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x57] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x58] = {'op': CPU.prototype._OP_CLI, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x59] = {'op': CPU.prototype._OP_EOR, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0x5A] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x5B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x5C] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x5D] = {'op': CPU.prototype._OP_EOR, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x5E] = {'op': CPU.prototype._OP_LSR, 'cycle': 7, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x5F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x60] = {'op': CPU.prototype._OP_RTS, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x61] = {'op': CPU.prototype._OP_ADC, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0x62] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x63] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x64] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x65] = {'op': CPU.prototype._OP_ADC, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x66] = {'op': CPU.prototype._OP_ROR, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x67] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x68] = {'op': CPU.prototype._OP_PLA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x69] = {'op': CPU.prototype._OP_ADC, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0x6A] = {'op': CPU.prototype._OP_ROR, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_ACCUMULATOR};
CPU.prototype._OP[0x6B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x6C] = {'op': CPU.prototype._OP_JMP, 'cycle': 0, 'mode': CPU.prototype._ADDRESSING_INDIRECT};
CPU.prototype._OP[0x6D] = {'op': CPU.prototype._OP_ADC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x6E] = {'op': CPU.prototype._OP_ROR, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x6F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x70] = {'op': CPU.prototype._OP_BVS, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0x71] = {'op': CPU.prototype._OP_ADC, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0x72] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x73] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x74] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x75] = {'op': CPU.prototype._OP_ADC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x76] = {'op': CPU.prototype._OP_ROR, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x77] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x78] = {'op': CPU.prototype._OP_SEI, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x79] = {'op': CPU.prototype._OP_ADC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0x7A] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x7B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x7C] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x7D] = {'op': CPU.prototype._OP_ADC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x7E] = {'op': CPU.prototype._OP_ROR, 'cycle': 7, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x7F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x80] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x81] = {'op': CPU.prototype._OP_STA, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0x82] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x83] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x84] = {'op': CPU.prototype._OP_STY, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x85] = {'op': CPU.prototype._OP_STA, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x86] = {'op': CPU.prototype._OP_STX, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0x87] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x88] = {'op': CPU.prototype._OP_DEY, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x89] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x8A] = {'op': CPU.prototype._OP_TXA, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x8B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x8C] = {'op': CPU.prototype._OP_STY, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x8D] = {'op': CPU.prototype._OP_STA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x8E] = {'op': CPU.prototype._OP_STX, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0x8F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x90] = {'op': CPU.prototype._OP_BCC, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0x91] = {'op': CPU.prototype._OP_STA, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0x92] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x93] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x94] = {'op': CPU.prototype._OP_STY, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x95] = {'op': CPU.prototype._OP_STA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0x96] = {'op': CPU.prototype._OP_STX, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_Y};
CPU.prototype._OP[0x97] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0x98] = {'op': CPU.prototype._OP_TYA, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x99] = {'op': CPU.prototype._OP_STA, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0x9A] = {'op': CPU.prototype._OP_TXS, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0x9B] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x9C] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x9D] = {'op': CPU.prototype._OP_STA, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0x9E] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0x9F] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xA0] = {'op': CPU.prototype._OP_LDY, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0xA1] = {'op': CPU.prototype._OP_LDA, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0xA2] = {'op': CPU.prototype._OP_LDX, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0xA3] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xA4] = {'op': CPU.prototype._OP_LDY, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xA5] = {'op': CPU.prototype._OP_LDA, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xA6] = {'op': CPU.prototype._OP_LDX, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xA7] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xA8] = {'op': CPU.prototype._OP_TAY, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xA9] = {'op': CPU.prototype._OP_LDA, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0xAA] = {'op': CPU.prototype._OP_TAX, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xAB] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xAC] = {'op': CPU.prototype._OP_LDY, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xAD] = {'op': CPU.prototype._OP_LDA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xAE] = {'op': CPU.prototype._OP_LDX, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xAF] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xB0] = {'op': CPU.prototype._OP_BCS, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0xB1] = {'op': CPU.prototype._OP_LDA, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0xB2] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xB3] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xB4] = {'op': CPU.prototype._OP_LDY, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0xB5] = {'op': CPU.prototype._OP_LDA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0xB6] = {'op': CPU.prototype._OP_LDX, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_Y};
CPU.prototype._OP[0xB7] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xB8] = {'op': CPU.prototype._OP_CLV, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xB9] = {'op': CPU.prototype._OP_LDA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0xBA] = {'op': CPU.prototype._OP_TSX, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xBB] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xBC] = {'op': CPU.prototype._OP_LDY, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0xBD] = {'op': CPU.prototype._OP_LDA, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0xBE] = {'op': CPU.prototype._OP_LDX, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0xBF] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xC0] = {'op': CPU.prototype._OP_CPY, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0xC1] = {'op': CPU.prototype._OP_CMP, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0xC2] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xC3] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xC4] = {'op': CPU.prototype._OP_CPY, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xC5] = {'op': CPU.prototype._OP_CMP, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xC6] = {'op': CPU.prototype._OP_DEC, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xC7] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xC8] = {'op': CPU.prototype._OP_INY, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xC9] = {'op': CPU.prototype._OP_CMP, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0xCA] = {'op': CPU.prototype._OP_DEX, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xCB] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xCC] = {'op': CPU.prototype._OP_CPY, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xCD] = {'op': CPU.prototype._OP_CMP, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xCE] = {'op': CPU.prototype._OP_DEC, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xCF] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xD0] = {'op': CPU.prototype._OP_BNE, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0xD1] = {'op': CPU.prototype._OP_CMP, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0xD2] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xD3] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xD4] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xD5] = {'op': CPU.prototype._OP_CMP, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0xD6] = {'op': CPU.prototype._OP_DEC, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0xD7] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xD8] = {'op': CPU.prototype._OP_CLD, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xD9] = {'op': CPU.prototype._OP_CMP, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0xDA] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xDB] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xDC] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xDD] = {'op': CPU.prototype._OP_CMP, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0xDE] = {'op': CPU.prototype._OP_DEC, 'cycle': 7, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0xDF] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xE0] = {'op': CPU.prototype._OP_CPX, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0xE1] = {'op': CPU.prototype._OP_SBC, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_X};
CPU.prototype._OP[0xE2] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xE3] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xE4] = {'op': CPU.prototype._OP_CPX, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xE5] = {'op': CPU.prototype._OP_SBC, 'cycle': 3, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xE6] = {'op': CPU.prototype._OP_INC, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_ZERO_PAGE};
CPU.prototype._OP[0xE7] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xE8] = {'op': CPU.prototype._OP_INX, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xE9] = {'op': CPU.prototype._OP_SBC, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMMEDIATE};
CPU.prototype._OP[0xEA] = {'op': CPU.prototype._OP_NOP, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xEB] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xEC] = {'op': CPU.prototype._OP_CPX, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xED] = {'op': CPU.prototype._OP_SBC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xEE] = {'op': CPU.prototype._OP_INC, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_ABSOLUTE};
CPU.prototype._OP[0xEF] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xF0] = {'op': CPU.prototype._OP_BEQ, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_RELATIVE};
CPU.prototype._OP[0xF1] = {'op': CPU.prototype._OP_SBC, 'cycle': 5, 'mode': CPU.prototype._ADDRESSING_INDEXED_INDIRECT_Y};
CPU.prototype._OP[0xF2] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xF3] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xF4] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xF5] = {'op': CPU.prototype._OP_SBC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0xF6] = {'op': CPU.prototype._OP_INC, 'cycle': 6, 'mode': CPU.prototype._ADDRESSING_INDEXED_ZERO_PAGE_X};
CPU.prototype._OP[0xF7] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};

CPU.prototype._OP[0xF8] = {'op': CPU.prototype._OP_SED, 'cycle': 2, 'mode': CPU.prototype._ADDRESSING_IMPLIED};
CPU.prototype._OP[0xF9] = {'op': CPU.prototype._OP_SBC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_Y};
CPU.prototype._OP[0xFA] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xFB] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xFC] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};
CPU.prototype._OP[0xFD] = {'op': CPU.prototype._OP_SBC, 'cycle': 4, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0xFE] = {'op': CPU.prototype._OP_INC, 'cycle': 7, 'mode': CPU.prototype._ADDRESSING_INDEXED_ABSOLUTE_X};
CPU.prototype._OP[0xFF] = {'op': CPU.prototype._OP_INV, 'cycle': 0, 'mode': null};


CPU.prototype.initMemoryController = function(ppu, pad1) {
  this.ppu = ppu;
  this.pad1 = pad1;
};


CPU.prototype.setROM = function(rom) {
  this.rom = rom;
  // TODO: temporal
  this._jumpToInterruptHandler(this._INTERRUPT_RESET);
};


CPU.prototype._MAP_CONTAINER = {'target': null, 'addr': null};
CPU.prototype._map = function(address) {
  var addr = null;
  var target = null;

  if(address >= 0x0000 && address < 0x2000) {
    target = this.ram;
    addr = address & 0x7ff;
  } else if(address >= 0x2000 && address < 0x4000) {
    // TODO: this might should move to PPU class.
    addr = address & 0x7;
    switch(addr) {
      case 0x0000:
        target = this.ppu.ctrl1;
        break;
      case 0x0001:
        target = this.ppu.ctrl2;
        break;
      case 0x0002:
        target = this.ppu.sr;
        break;
      case 0x0003:
        target = this.ppu.sprAddr;
        break;
      case 0x0004:
        target = this.ppu.sprIO;
        break;
      case 0x0005:
        target = this.ppu.vRAMAddr1;
        break;
      case 0x0006:
        target = this.ppu.vRAMAddr2;
        break;
      case 0x0007:
        target = this.ppu.vRAMIO;
        break;
    }
    addr = null;
  } else if(address >= 0x4000 && address < 0x4020) {
    switch(address) {
      case 0x4000:
        break;
      case 0x4001:
        break;
      case 0x4002:
        break;
      case 0x4003:
        break;
      case 0x4004:
        break;
      case 0x4005:
        break;
      case 0x4006:
        break;
      case 0x4007:
        break;
      case 0x4008:
        break;
      case 0x4009:
        break;
      case 0x400A:
        break;
      case 0x400B:
        break;
      case 0x400C:
        break;
      case 0x400D:
        break;
      case 0x400E:
        break;
      case 0x400F:
        break;
      case 0x4010:
        break;
      case 0x4011:
        break;
      case 0x4012:
        break;
      case 0x4013:
        break;
      case 0x4014:
        target = this.ppu.sprDMA;
        break;
      case 0x4015:
        break;
      case 0x4016:
        target = this.pad1.register;
        break;
      case 0x4017:
        break;
      case 0x4018:
        break;
      case 0x4019:
        break;
      case 0x401A:
        break;
      case 0x401B:
        break;
      case 0x401C:
        break;
      case 0x401D:
        break;
      case 0x401E:
        break;
      case 0x401F:
        break;
    }
    addr = null;
    // TODO: temporal.
    if(target === null) {
      target = new Register();
    }
  } else if(address >= 0x4020 && address < 0x6000) {
    target = this.ram;
    addr = address;
  } else if(address >= 0x6000 && address < 0x8000) {
    target = this.ram;
    addr = address;
  } else if(address >= 0x8000 && address < 0x10000) {
    target = this.rom;
    // this address translation might should be done by ROM Memory mapper.
    addr = address - 0x8000;
  }

  var result = this._MAP_CONTAINER;
  result.target = target;
  result.addr = addr;

  return result;
};


/**
 * TODO: write note.
 */
CPU.prototype.load = function(address) {
  var map = this._map(address);
  return map.target.load(map.addr);
};


CPU.prototype.load2Bytes = function(address) {
  return this.load(address) | (this.load(address+1) << 8);
};


/**
 * TODO: write note
 */
CPU.prototype.load2BytesFromZeropage = function(address) {
  return this.ram.load(address & 0xff) | (this.ram.load((address+1) & 0xff) << 8);
};


CPU.prototype.load2BytesInPage = function(address) {
  var addr1 = address;
  var addr2 = (address & 0xff00) | ((address+1) & 0xff);
  return this.load(addr1) | (this.load(addr2) << 8);
};


CPU.prototype.store = function(address, value) {
  var map = this._map(address);
  if(map.addr === null)
    map.target.store(value);
  else
    map.target.store(map.addr, value);
};


/**
 * TODO: write note
 */
CPU.prototype.store2Bytes = function(address, value) {
  this.store(address,   value);
  this.store(address+1, value >> 8);
};


CPU.prototype._fetch = function() {
  var opc = this.load(this.pc.load());
  this.pc.increment();
  return opc;
};


CPU.prototype._decode = function(opc) {
  return this._OP[opc];
};


/**
 * Note: This is one of the heaviest functions.
 */
CPU.prototype.runCycle = function() {
  if(this.handling <= 0) {

/*
    var opc = this._fetch();
    var op = this._decode(opc);
*/

    /*
     * Note: using inlining for the performance.
     */
    var opc = this.load(this.pc.load());
    this.pc.increment();
    var op = this._OP[opc];

    this._operate(op);
    this.handling = op.cycle;
  }
  this.handling--;
};


/**
 * TODO: not fixed yet.
 */
CPU.prototype.interrupt = function(type) {
  if(type == this._INTERRUPT_IRQ && this.p.isI()) {
    return;
  }
  this._pushStack2Bytes(this.pc.load());
  this._pushStack(this.p.load());
  this.p.setI();
  this._jumpToInterruptHandler(type);
};


CPU.prototype._jumpToInterruptHandler = function(type) {
  this.pc.store(this.load2Bytes(this._INTERRUPT_HANDLER_ADDRESSES[type]));
};


CPU.prototype._loadMemoryWithAddressingMode = function(op) {
  if(op.mode.id == this._ADDRESSING_ACCUMULATOR.id) {
    return this.a.load();
  }

  var address = this._getMemoryAddressWithAddressingMode(op);
  var value = this.load(address);
  // expects that relative addressing mode is used only for load.
  if(op.mode.id == this._ADDRESSING_RELATIVE.id) {
    // TODO: confirm if this logic is right.
    if(value & 0x80)
      value = value | 0xff00;
  }
  return value;
};


CPU.prototype._storeMemoryWithAddressingMode = function(op, value) {
  if(op.mode.id == this._ADDRESSING_ACCUMULATOR.id) {
    this.a.store(value);
    return;
  }

  var address = this._getMemoryAddressWithAddressingMode(op);
  this.store(address, value);
};


CPU.prototype._updateMemoryWithAddressingMode = function(op, func) {
  var address;
  var src;

  if(op.mode.id == this._ADDRESSING_ACCUMULATOR.id) {
    src = this.a.load();
  } else {
    address = this._getMemoryAddressWithAddressingMode(op);
    src = this.load(address);
  }

  var result = func(src);

  if(op.mode.id == this._ADDRESSING_ACCUMULATOR.id) {
    this.a.store(result);
  } else {
    this.store(address, result);
  }
};


/**
 * TODO: make function of each addressing mode for the performance?
 */
CPU.prototype._getMemoryAddressWithAddressingMode = function(op) {
  var address = null;
  switch(op.mode.id) {
    case this._ADDRESSING_IMMEDIATE.id:
    case this._ADDRESSING_RELATIVE.id:
      address = this.pc.load();
      this.pc.increment();
      break;

    case this._ADDRESSING_ABSOLUTE.id:
    case this._ADDRESSING_INDEXED_ABSOLUTE_X.id:
    case this._ADDRESSING_INDEXED_ABSOLUTE_Y.id:
      address = this.load2Bytes(this.pc.load());
      this.pc.incrementBy2();
      switch(op.mode.id) {
        case this._ADDRESSING_INDEXED_ABSOLUTE_X.id:
          address += this.x.load();
          break;
        case this._ADDRESSING_INDEXED_ABSOLUTE_Y.id:
          address += this.y.load();
          break;
      }
      address = address & 0xffff;
      break;

    case this._ADDRESSING_ZERO_PAGE.id:
    case this._ADDRESSING_INDEXED_ZERO_PAGE_X.id:
    case this._ADDRESSING_INDEXED_ZERO_PAGE_Y.id:
      address = this.load(this.pc.load());
      this.pc.increment();
      switch(op.mode.id) {
        case this._ADDRESSING_INDEXED_ZERO_PAGE_X.id:
        address += this.x.load();
        break;
        case this._ADDRESSING_INDEXED_ZERO_PAGE_Y.id:
        address += this.y.load();
        break;
      }
      address = address & 0xff;
      break;

    case this._ADDRESSING_INDIRECT.id:
      var tmp = this.load2Bytes(this.pc.load());
      this.pc.incrementBy2();
      address = this.load2BytesInPage(tmp);
      break;

    case this._ADDRESSING_INDEXED_INDIRECT_X.id:
      var tmp = this.load(this.pc.load());
      this.pc.increment();
      tmp += this.x.load();
      tmp = tmp & 0xff;
      address = this.load2BytesFromZeropage(tmp);
      break;

    case this._ADDRESSING_INDEXED_INDIRECT_Y.id:
      var tmp = this.load(this.pc.load());
      this.pc.increment();
      address = this.load2BytesFromZeropage(tmp);
      address += this.y.load();
      address = address & 0xffff;
      break;

    default:
      // TODO: throw Exception?
      break;
  }
  return address;
};


/**
 * TODO: there is a room to optimize the code.
 * TODO: add callback prevention for registers.
 * @param mem CPUMemoryController or ROM
 */
CPU.prototype._dumpMemoryAddressingMode = function(op, mem, pc) {
  var buffer = '';
  var ramDump = (mem instanceof CPU) ? true : false;

  switch(op.mode) {
    case this._ADDRESSING_IMMEDIATE:
      buffer += '#' + __10to16(mem.load(pc, true), 2);
      break;

    case this._ADDRESSING_RELATIVE:
      var value = mem.load(pc, true);
      if(value & 0x80) {
        value = -(0x100 - value); // make negative native integer.
      }
      buffer += value.toString(10);
      break;

    case this._ADDRESSING_ABSOLUTE:
      var address = mem.load2Bytes(pc, true);
      buffer += __10to16(address, 4);
      if(ramDump) {
        buffer += '(' + __10to16(mem.load(address, true), 2) + ')';
      }
      break;

    case this._ADDRESSING_INDEXED_ABSOLUTE_X:
      var address = mem.load2Bytes(pc, true);
      buffer += __10to16(address, 4) + ',X ';
      if(ramDump) {
        address += this.x.load();
        address = address & 0xffff;
        buffer += '(' + __10to16(mem.load(address, true), 2) + ')';
      }
      break;

    case this._ADDRESSING_INDEXED_ABSOLUTE_Y:
      var address = mem.load2Bytes(pc, true);
      buffer += __10to16(address, 4) + ',Y ';
      if(ramDump) {
        address += this.y.load();
        address = address & 0xffff;
        buffer += '(' + __10to16(mem.load(address, true), 2) + ')';
      }
      break;

    case this._ADDRESSING_ZERO_PAGE:
      var address = mem.load(pc, true);
      buffer += __10to16(address, 2);
      if(ramDump) {
        buffer += '(' + __10to16(mem.load(address, true), 2) + ')';
      }
      break;

    case this._ADDRESSING_INDEXED_ZERO_PAGE_X:
      var address = mem.load(pc, true);
      buffer += __10to16(address, 2) + ',X ';
      if(ramDump) {
        address += this.x.load();
        address = address & 0xff;
        buffer += '(' + __10to16(mem.load(address, true), 2) + ')';
      }
      break;

    case this._ADDRESSING_INDEXED_ZERO_PAGE_Y:
      var address = mem.load(pc, true);
      buffer += __10to16(address, 2) + ',Y ';
      if(ramDump) {
        address += this.y.load();
        address = address & 0xff;
        buffer += '(' + __10to16(mem.load(address, true), 2) + ')';
      }
      break;

    case this._ADDRESSING_INDIRECT:
      var address = mem.load2Bytes(pc, true);
      buffer += __10to16(address, 4);
      if(ramDump) {
        var address2 = mem.load2Bytes(address, true);
        buffer += '(';
        buffer += __10to16(address2, 4);
        buffer += '(' + __10to16(mem.load(address2, true), 2) + ')';
        buffer += ')';
      }
      break;

    case this._ADDRESSING_INDEXED_INDIRECT_X:
      var address = mem.load(pc, true);
      buffer += '(' + __10to16(address, 2) + ',X) ';
      if(ramDump) {
        address += this.x.load();
        address = address & 0xffff;
        var address2 = mem.load2Bytes(address, true);
        buffer += '(';
        buffer += __10to16(address2, 4);
        buffer += '(' + __10to16(mem.load(address2, true), 2) + ')';
        buffer += ')';
      }
      break;

    case this._ADDRESSING_INDEXED_INDIRECT_Y:
      var address = mem.load(pc, true);
      buffer += '(' + __10to16(address, 2) + '),Y ';
      if(ramDump) {
        var address2 = mem.load2BytesFromZeropage(address, true);
        address2 += this.y.load();
        address2 = address2 & 0xffff;
        buffer += '(';
        buffer += __10to16(address2, 4);
        buffer += '(' + __10to16(mem.load(address2, true), 2) + ')';
        buffer += ')';
      }
      break;

    case this._ADDRESSING_ACCUMULATOR:
      if(ramDump) {
        buffer += 'A(' + __10to16(this.a.load(), 2) + ')';
      }
      break;

    default:
      // TODO: throw Exception?
      break;
  }
  return buffer;
};


CPU.prototype._updateN = function(value) {
  if((value & 0x80) == 0)
    this.p.clearN();
  else
    this.p.setN();
};


CPU.prototype._updateZ = function(value) {
  if((value & 0xff) == 0)
    this.p.setZ();
  else
    this.p.clearZ();
};


CPU.prototype._updateC = function(value) {
  if((value & 0x100) == 0)
    this.p.clearC();
  else
    this.p.setC();
};


CPU.prototype._getStackAddress = function() {
  return this.sp.load() + 0x100;
};


CPU.prototype._pushStack = function(value) {
  this.store(this._getStackAddress(), value);
  this.sp.decrement();
};


CPU.prototype._pushStack2Bytes = function(value) {
  this.store(this._getStackAddress(), (value >> 8) & 0xff);
  this.sp.decrement();
  this.store(this._getStackAddress(), value & 0xff);
  this.sp.decrement();
};


CPU.prototype._popStack = function() {
  this.sp.increment();
  return this.load(this._getStackAddress());
};


CPU.prototype._popStack2Bytes = function() {
  this.sp.increment();
  var value = this.load(this._getStackAddress());
  this.sp.increment();
  return (this.load(this._getStackAddress()) << 8) | value;
};


CPU.prototype._doBranch = function(op, flag) {
  var result = this._loadMemoryWithAddressingMode(op);
  if(flag)
    this.pc.add(result);
};


/**
 * TODO: make each operation class or method
 *       for the performance and easy verification?
 * TODO: functions for _updateMemoryWithAddressingMode occur memory allocation
 *       and can lead GC which could affect the performance.
 */
CPU.prototype._operate = function(op) {
  switch(op.op.opc) {
    case this._OP_ADC.opc:
      var src1 = this.a.load();
      var src2 = this._loadMemoryWithAddressingMode(op);
      var c = this.p.isC() ? 1 : 0;
      var result = src1 + src2 + c;
      this.a.store(result);
      this._updateN(result)
      this._updateZ(result)
      this._updateC(result)
      if(!((src1 ^ src2) & 0x80) && ((src2 ^ result) & 0x80))
        this.p.setV();
      else
        this.p.clearV();
      break;

    case this._OP_AND.opc:
      var src1 = this.a.load();
      var src2 = this._loadMemoryWithAddressingMode(op);
      var result = src1 & src2;
      this.a.store(result);
      this._updateN(result);
      this._updateZ(result);
      break;

    case this._OP_ASL.opc:
      var self = this;
      var func = function(src) {
        var result = src << 1;
        self._updateN(result)
        self._updateZ(result);
        self._updateC(result);
        return result;
      };
      this._updateMemoryWithAddressingMode(op, func);
      break;

    case this._OP_BCC.opc:
      this._doBranch(op, !this.p.isC());
      break;

    case this._OP_BCS.opc:
      this._doBranch(op, this.p.isC());
      break;

    case this._OP_BEQ.opc:
      this._doBranch(op, this.p.isZ());
      break;

    // TODO: check logic.
    case this._OP_BIT.opc:
      var src1 = this.a.load();
      var src2 = this._loadMemoryWithAddressingMode(op);
      var result = src1 & src2;
      this._updateN(src2);
      this._updateZ(result);
      if((src2 & 0x40) == 0)
        this.p.clearV();
      else
        this.p.setV();
      break;

    case this._OP_BMI.opc:
      this._doBranch(op, this.p.isN());
      break;

    case this._OP_BNE.opc:
      this._doBranch(op, !this.p.isZ());
      break;

    case this._OP_BPL.opc:
      this._doBranch(op, !this.p.isN());
      break;

    // TODO: check logic.
    case this._OP_BRK.opc:
      this.pc.increment(); // necessary?
      this.p.setB();
      this.interrupt(this._INTERRUPT_IRQ);
      break;

    case this._OP_BVC.opc:
      this._doBranch(op, !this.p.isV());
      break;

    case this._OP_BVS.opc:
      this._doBranch(op, this.p.isV());
      break;

    case this._OP_CLC.opc:
      this.p.clearC();
      break;

    case this._OP_CLD.opc:
      this.p.clearD();
      break;

    case this._OP_CLI.opc:
      this.p.clearI();
      break;

    case this._OP_CLV.opc:
      this.p.clearV();
      break;

    // TODO: separate?
    case this._OP_CMP.opc:
    case this._OP_CPX.opc:
    case this._OP_CPY.opc:
      var src1;
      switch(op.op.opc) {
        case this._OP_CMP.opc:
          src1 = this.a.load();
          break;
        case this._OP_CPX.opc:
          src1 = this.x.load();
          break;
        case this._OP_CPY.opc:
          src1 = this.y.load();
          break;
      }
      var src2 = this._loadMemoryWithAddressingMode(op);
      var result = src1 - src2;
      this._updateN(result);
      this._updateZ(result);
      if(src1 >= src2)
        this.p.setC();
      else
        this.p.clearC();
      break;

    case this._OP_DEC.opc:
      var self = this;
      var func = function(src) {
        var result = src - 1;
        self._updateN(result);
        self._updateZ(result);
        return result;
      };
      this._updateMemoryWithAddressingMode(op, func);
      break;

    case this._OP_DEX.opc:
    case this._OP_DEY.opc:
      var reg;
      switch(op.op.opc) {
        case this._OP_DEX.opc:
          reg = this.x;
          break;
        case this._OP_DEY.opc:
          reg = this.y;
          break;
      }
      var src1 = reg.load();
      var result = src1 - 1;
      reg.store(result);
      this._updateN(result);
      this._updateZ(result);
      break;

    case this._OP_EOR.opc:
      var src1 = this.a.load();
      var src2 = this._loadMemoryWithAddressingMode(op);
      var result = src1 ^ src2;
      this.a.store(result);
      this._updateN(result);
      this._updateZ(result);
      break;

    case this._OP_INC.opc:
      var self = this;
      var func = function(src) {
        var result = src + 1;
        self._updateN(result);
        self._updateZ(result);
        return result;
      };
      this._updateMemoryWithAddressingMode(op, func);
      break;

    case this._OP_INX.opc:
    case this._OP_INY.opc:
      var reg;
      switch(op.op.opc) {
        case this._OP_INX.opc:
          reg = this.x;
          break;
        case this._OP_INY.opc:
          reg = this.y;
          break;
      }
      var src1 = reg.load();
      var result = src1 + 1;
      reg.store(result);
      this._updateN(result);
      this._updateZ(result);
      break;

    // TODO: check the logic.
    case this._OP_JMP.opc:
      var address = this._getMemoryAddressWithAddressingMode(op);
      this.pc.store(address);
      break;

    // TODO: check the logic.
    case this._OP_JSR.opc:
      var address = this._getMemoryAddressWithAddressingMode(op);
      this.pc.decrement();
      this._pushStack2Bytes(this.pc.load());
      this.pc.store(address);
      break;

    case this._OP_LDA.opc:
    case this._OP_LDX.opc:
    case this._OP_LDY.opc:
      var result = this._loadMemoryWithAddressingMode(op);
      var reg;
      switch(op.op.opc) {
        case this._OP_LDA.opc:
          reg = this.a;
          break;
        case this._OP_LDX.opc:
          reg = this.x;
          break;
        case this._OP_LDY.opc:
          reg = this.y;
          break;
      }
      reg.store(result);
      this._updateN(result);
      this._updateZ(result);
      break;

    case this._OP_LSR.opc:
      var self = this;
      var func = function(src) {
        var result = src >> 1;
        self.p.clearN();
        self._updateZ(result);
        if((src & 1) == 0)
          self.p.clearC();
        else
          self.p.setC();
        return result;
      };
      this._updateMemoryWithAddressingMode(op, func);
      break;

    case this._OP_NOP.opc:
      break;

    case this._OP_ORA.opc:
      var src1 = this.a.load();
      var src2 = this._loadMemoryWithAddressingMode(op);
      var result = src1 | src2;
      this.a.store(result);
      this._updateN(result);
      this._updateZ(result);
      break;

    case this._OP_PHA.opc:
    case this._OP_PHP.opc:
      var reg;
      switch(op.op.opc) {
        case this._OP_PHA.opc:
          reg = this.a;
          break;
        case this._OP_PHP.opc:
          // TODO: check this logic. when to clear?
          this.p.setA();
          this.p.setB();
          reg = this.p;
          break;
      }
      this._pushStack(reg.load());
      break;

    case this._OP_PLA.opc:
      var result = this._popStack();
      this.a.store(result);
      this._updateN(result);
      this._updateZ(result);
      break;

    case this._OP_PLP.opc:
      this.p.store(this._popStack());
      break;

    case this._OP_ROL.opc:
      var self = this;
      var func = function(src) {
        var c = self.p.isC() ? 1 : 0;
        var result = (src << 1) | c;
        self._updateN(result);
        self._updateZ(result);
        self._updateC(result);
        return result;
      };
      this._updateMemoryWithAddressingMode(op, func);
      break;

    case this._OP_ROR.opc:
      var self = this;
      var func = function(src) {
        var c = self.p.isC() ? 0x80 : 0x00;
        var result = (src >> 1) | c;
        self._updateN(result);
        self._updateZ(result);
        if((src & 1) == 0)
          self.p.clearC();
        else
          self.p.setC();
        return result;
      };
      this._updateMemoryWithAddressingMode(op, func);
      break;

    // TODO: check logic.
    case this._OP_RTI.opc:
      this.p.store(this._popStack());
      this.pc.store(this._popStack2Bytes());
      break;

    // TODO: check logic.
    case this._OP_RTS.opc:
      this.pc.store(this._popStack2Bytes() + 1);
      break;

    case this._OP_SBC.opc:
      var src1 = this.a.load();
      var src2 = this._loadMemoryWithAddressingMode(op);
      var c = this.p.isC() ? 0 : 1;
      var result = src1 - src2 - c;
      this.a.store(result);
      this._updateN(result)
      this._updateZ(result)
      // TODO: check if this logic is right.
      if(src1 >= src2 + c) 
        this.p.setC();
      else
        this.p.clearC();
      // TODO: implement right overflow logic.
      //       this is just a temporal logic.
      if(((src1 ^ result) & 0x80) && ((src1 ^ src2) & 0x80))
        this.p.setV();
      else
        this.p.clearV();
      break;

    case this._OP_SEC.opc:
      this.p.setC();
      break;

    case this._OP_SED.opc:
      this.p.setD();
      break;

    case this._OP_SEI.opc:
      this.p.setI();
      break;

    case this._OP_STA.opc:
    case this._OP_STX.opc:
    case this._OP_STY.opc:
      var reg;
      switch(op.op.opc) {
        case this._OP_STA.opc:
          reg = this.a;
          break;
        case this._OP_STX.opc:
          reg = this.x;
          break;
        case this._OP_STY.opc:
          reg = this.y;
          break;
      }
      this._storeMemoryWithAddressingMode(op, reg.load());
      break;

    case this._OP_TAX.opc:
    case this._OP_TAY.opc:
    case this._OP_TSX.opc:
    case this._OP_TXA.opc:
    case this._OP_TXS.opc:
    case this._OP_TYA.opc:
      var srcReg;
      var desReg;
      switch(op.op.opc) {
        case this._OP_TAX.opc:
          srcReg = this.a;
          desReg = this.x;
          break;
        case this._OP_TAY.opc:
          srcReg = this.a;
          desReg = this.y;
          break;
        case this._OP_TSX.opc:
          srcReg = this.sp;
          desReg = this.x;
          break;
        case this._OP_TXA.opc:
          srcReg = this.x;
          desReg = this.a;
          break;
        case this._OP_TXS.opc:
          srcReg = this.x;
          desReg = this.sp;
          break;
        case this._OP_TYA.opc:
          srcReg = this.y;
          desReg = this.a;
          break;
      }
      var result = srcReg.load();
      desReg.store(result);
      if(op.op.opc != this._OP_TXS.opc) {
        this._updateN(result);
        this._updateZ(result);
      }
      break;

    default:
      // throw exception?
      break;
  }
};


/**
 * this method is in this class to use Addressing Mode.
 * TODO: temporal.
 */
CPU.prototype.disassembleROM = function() {
  var buffer = '';
  var rom = this.rom;
  var pc = ROM.prototype._HEADER_SIZE;
  var previousIsZero = false;
  var skipZero = false;

  // TODO: temporal
  while(pc < 0x4010) {
    var str = '';
    var opc = rom.loadWithoutMapping(pc);
    var op = this._decode(opc);

    if(previousIsZero && opc == 0 && rom.loadWithoutMapping((pc+1)&0xffff) == 0) {
      pc += 1;
      skipZero = true;
      continue;
    }

    if(skipZero)
      buffer += '...\n';
    skipZero = false;

    str += __10to16(pc - ROM.prototype._HEADER_SIZE, 4) + ' ';
    str += __10to16(opc, 2) + ' ';
    str += op.op.name + ' ';
    str += this._dumpMemoryAddressingMode(op,
                                          rom,
                                          (pc + 1) & 0xffff)
             + ' ';

    while(str.length < 30) {
      str += ' ' ;
    }

    if(op.mode) {
      str += op.mode.name;
      pc += op.mode.pc;
    } else {
      pc += 1;
    }

    buffer += str + '\n';
    previousIsZero = opc == 0;
  }
  return buffer;
};


// TODO: temporal
CPU.prototype.dump = function() {
  var buffer = '';
  var opc = this.load(this.pc.load());
  var op = this._decode(opc);

  buffer += 'p:'  + this.p.dump()  + ' ';
  buffer += 'pc:' + this.pc.dump() + '(' + __10to16(opc, 2) + ')' + ' ';
  buffer += 'sp:' + this.sp.dump() + ' ';
  buffer += 'a:'  + this.a.dump()  + ' ';
  buffer += 'x:'  + this.x.dump()  + ' ';
  buffer += 'y:'  + this.y.dump()  + ' ';

  buffer += op.op.name + ' ' +
              this._dumpMemoryAddressingMode(op,
                                             this,
                                             (this.pc.load() + 1) & 0xffff)
              + ' ';

  while(buffer.length < 90) {
    buffer += ' ' ;
  }

  buffer += op.mode.name;

  return buffer;
};


CPU.prototype.dumpRAM = function() {
  return this.ram.dump();
};



function CPUStatusRegister() {
  this.parent = Register;
  this.parent.call(this);
};
__inherit(CPUStatusRegister, Register);

CPUStatusRegister.prototype._N_BIT = 7;
CPUStatusRegister.prototype._V_BIT = 6;
CPUStatusRegister.prototype._A_BIT = 5;  // unused bit. TODO: temporal name
CPUStatusRegister.prototype._B_BIT = 4;
CPUStatusRegister.prototype._D_BIT = 3;
CPUStatusRegister.prototype._I_BIT = 2;
CPUStatusRegister.prototype._Z_BIT = 1;
CPUStatusRegister.prototype._C_BIT = 0;


CPUStatusRegister.prototype.isN = function() {
  return this.loadBit(this._N_BIT);
};


CPUStatusRegister.prototype.setN = function() {
  this.storeBit(this._N_BIT, 1);
};


CPUStatusRegister.prototype.clearN = function() {
  this.storeBit(this._N_BIT, 0);
};


CPUStatusRegister.prototype.isV = function() {
  return this.loadBit(this._V_BIT);
};


CPUStatusRegister.prototype.setV = function() {
  this.storeBit(this._V_BIT, 1);
};


CPUStatusRegister.prototype.clearV = function() {
  this.storeBit(this._V_BIT, 0);
};


CPUStatusRegister.prototype.isA = function() {
  return this.loadBit(this._A_BIT);
};


CPUStatusRegister.prototype.setA = function() {
  this.storeBit(this._A_BIT, 1);
};


CPUStatusRegister.prototype.clearA = function() {
  this.storeBit(this._A_BIT, 0);
};


CPUStatusRegister.prototype.isB = function() {
  return this.loadBit(this._B_BIT);
};


CPUStatusRegister.prototype.setB = function() {
  this.storeBit(this._B_BIT, 1);
};


CPUStatusRegister.prototype.clearB = function() {
  this.storeBit(this._B_BIT, 0);
};


CPUStatusRegister.prototype.isD = function() {
  return this.loadBit(this._D_BIT);
};


CPUStatusRegister.prototype.setD = function() {
  this.storeBit(this._D_BIT, 1);
};


CPUStatusRegister.prototype.clearD = function() {
  this.storeBit(this._D_BIT, 0);
};


CPUStatusRegister.prototype.isI = function() {
  return this.loadBit(this._I_BIT);
};


CPUStatusRegister.prototype.setI = function() {
  this.storeBit(this._I_BIT, 1);
};


CPUStatusRegister.prototype.clearI = function() {
  this.storeBit(this._I_BIT, 0);
};


CPUStatusRegister.prototype.isZ = function() {
  return this.loadBit(this._Z_BIT);
};


CPUStatusRegister.prototype.setZ = function() {
  this.storeBit(this._Z_BIT, 1);
};


CPUStatusRegister.prototype.clearZ = function() {
  this.storeBit(this._Z_BIT, 0);
};


CPUStatusRegister.prototype.isC = function() {
  return this.loadBit(this._C_BIT);
};


CPUStatusRegister.prototype.setC = function() {
  this.storeBit(this._C_BIT, 1);
};


CPUStatusRegister.prototype.clearC = function() {
  this.storeBit(this._C_BIT, 0);
};


CPUStatusRegister.prototype.dump = function() {
  var buffer = '';
  buffer += this.parent.prototype.dump.call(this);
  buffer += '(';
  buffer += this.isN() ? 'N' : '-';
  buffer += this.isV() ? 'V' : '-';
  buffer += this.isB() ? 'B' : '-';
  buffer += this.isD() ? 'D' : '-';
  buffer += this.isI() ? 'I' : '-';
  buffer += this.isZ() ? 'Z' : '-';
  buffer += this.isC() ? 'C' : '-';
  buffer += ')';
  return buffer;
};


/**
 * CPU RAM.
 */
function RAM() {
  this.parent = GenericMemory;
  this.parent.call(this, this._CAPACITY);
};
__inherit(RAM, GenericMemory);

RAM.prototype._CAPACITY = 64 * 1024; // 64KB

