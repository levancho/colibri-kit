export class PropertyEditor {
  constructor() {
    this.element = document.createElement('input');
    this.element.inputMode = 'numeric';
    this.element.placeholder = 'R-000.000';
    this.element.oninput = () => {
      const input = this.element;
      const digits = (value) => value.replace(/[^0-9]/g, '');
      const offset = digits(input.value.slice(0, input.selectionStart)).length;
      const value = digits(input.value).slice(0, 6);
      input.value = value ? 'R-' + value.slice(0, 3) + (value.length > 3 ? '.' + value.slice(3) : '') : '';
      const position = Math.min(input.value.length, 2 + offset + Number(offset > 3));
      input.setSelectionRange(position, position);
    };
  }
  prepare() {
    this.element.value = this.value ?? '';
  }
  get editedValue() {
    return this.element.value;
  }
}
