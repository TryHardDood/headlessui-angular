import { Component, Directive, EmbeddedViewRef, EventEmitter, Host, Input, NgModule, OnInit, Output, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { generateId } from '../util';



/// LISTBOX




// Outputs not supported in structural directives. See https://github.com/angular/angular/issues/12121.
// Use a component instead
@Component({
    selector: 'hl-listbox',
    template: '<ng-content></ng-content>'
})
export class ListboxComponent<T>  {
    expanded = false;

    view!: EmbeddedViewRef<any>;

    windowClickUnlisten!: (() => void)

    listboxButton!: ListboxButtonDirective;
    listboxOptionsPanel!: ListboxOptionsPanelDirective;
    listboxOptions: ListboxOptionDirective<T>[] = []
    activeOption: ListboxOptionDirective<T> | null = null;

    @Input()
    value: T | null = null;

    @Output()
    onChange: EventEmitter<T | null> = new EventEmitter();

    constructor(private renderer: Renderer2) { }

    toggle() {
        if (this.expanded) {
            this.expanded = false
            this.listboxOptionsPanel.collapse()
            this.listboxButton.element.removeAttribute('aria-controls')
            this.listboxButton.element.removeAttribute('expanded')
            this.listboxOptions = []
            this.activeOption = null
            this.windowClickUnlisten();
            this.focusButton()
        } else {
            this.expanded = true
            this.listboxOptionsPanel.expand()
            this.listboxOptionsPanel.focus()
            if (this.listboxOptionsPanel.element != null) {
                this.listboxButton.element.setAttribute('aria-controls', this.listboxOptionsPanel.element.id)
            }
            this.listboxButton.element.setAttribute('expanded', 'true')
            this.windowClickUnlisten = this.initListeners()
        }
    }

    select(value: T | null) {
        this.onChange.emit(value)
        this.listboxOptions.forEach(option => {
            option.select(option.hlListboxOptionValue === value)
        });
    }

    isSelected(value: T | null) {
        return this.value === value;
    }

    focusButton() {
        this.listboxButton.focus()
    }

    focusOption(focusType: FocusType<T>) {
        const activeOption = this.calculateFocusedOption(focusType)
        if (activeOption === this.activeOption) {
            return
        }
        this.activeOption = activeOption
        this.listboxOptions.forEach(option => {
            if (this.activeOption) {
                this.listboxOptionsPanel.element?.setAttribute('aria-activedescendant', this.activeOption.element.id)
            } else {
                this.listboxOptionsPanel.element?.removeAttribute('aria-activedescendant')
            }
            option.focus(option === this.activeOption)
        });
    }

    clickActive() {
        this.activeOption?.element.click();
    }

    private calculateFocusedOption(focusType: FocusType<T>): ListboxOptionDirective<T> | null {
        let options;
        switch (focusType.kind) {
            case 'FocusSpecific':
                return focusType.option

            case 'FocusNothing':
                return null

            case 'FocusNext':
                options = this.listboxOptions.filter(option => !option.hlListboxOptionDisabled)
                if (this.activeOption === null) {
                    return options[0];
                } else {
                    let nextIndex = Math.min(options.indexOf(this.activeOption) + 1, options.length - 1);
                    return options[nextIndex];
                }

            case 'FocusPrevious':
                options = this.listboxOptions.filter(option => !option.hlListboxOptionDisabled)
                if (this.activeOption === null) {
                    return options[options.length - 1];
                } else {
                    let previousIndex = Math.max(options.indexOf(this.activeOption) - 1, 0);
                    return options[previousIndex];
                }
        }
    }

    // TODO: use HostListener instead
    private initListeners(): (() => void) {
        return this.renderer.listen(window, 'click', (event: MouseEvent) => {
            const target = event.target as HTMLElement

            if (this.listboxButton.element.contains(target)
                || this.listboxOptionsPanel?.element?.contains(target)) {
                return;
            }

            this.toggle();
        });
    }
}



// LISTBOX OPTION BUTTON


@Directive({
    selector: '[hlListboxButton]'
})
export class ListboxButtonDirective implements OnInit {
    element!: HTMLElement;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainerRef: ViewContainerRef,
        @Host() private listbox: ListboxComponent<any>,
        private renderer: Renderer2) {
        listbox.listboxButton = this;
    }

    ngOnInit(): void {
        const view = this.viewContainerRef.createEmbeddedView(this.templateRef);
        this.element = view.rootNodes[0];
        this.initAttributes(this.element)

        this.renderer.listen(this.element, 'click', () => {
            this.listbox.toggle();
        });

        this.renderer.listen(
            this.element,
            'keydown',
            (event: KeyboardEvent) => {
                switch (event.key) {
                    case 'Space':
                    case 'Enter':
                    case 'ArrowDown':
                        event.preventDefault();
                        this.listbox.toggle();
                        // delay focus until listbox option is initialized
                        setTimeout(() => this.listbox.focusOption({ kind: 'FocusNext' }))
                        break;

                    case 'ArrowUp':
                        event.preventDefault();
                        this.listbox.toggle();
                        // delay focus until listbox option is initialized
                        setTimeout(() => this.listbox.focusOption({ kind: 'FocusPrevious' }))
                        break;
                }
            }
        );
    }

    focus() {
        setTimeout(() => this.element?.focus())
    }

    private initAttributes(element: HTMLElement) {
        element.id = `headlessui-listbox-button-${generateId()}`
        element.setAttribute('type', 'button');
        element.setAttribute('aria-haspopup', 'true');
    }
}



/// LISTBOX OPTIONS PANEL


@Directive({
    selector: '[hlListboxOptions]'
})
export class ListboxOptionsPanelDirective {
    element: HTMLElement | null = null;

    expand() {
        const view = this.viewContainerRef.createEmbeddedView(this.templateRef);
        const element = view.rootNodes[0];
        this.initAttributes(element)
        this.initListeners(element)
        this.element = element;
        view.markForCheck();
    }

    collapse() {
        this.viewContainerRef.clear();
        this.element = null;
    }

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainerRef: ViewContainerRef,
        @Host() private listbox: ListboxComponent<any>,
        private renderer: Renderer2) {
        this.listbox.listboxOptionsPanel = this;
    }

    focus() {
        setTimeout(() => this.element?.focus({ preventScroll: true }))
    }

    private initAttributes(element: HTMLElement) {
        element.tabIndex = -1;
        element.id = `headlessui-listbox-options-${generateId()}`
        element.setAttribute('role', 'listbox');
        element.setAttribute('aria-labelledby', this.listbox.listboxButton.element.id)
    }

    private initListeners(element: HTMLElement) {
        this.renderer.listen(
            element,
            'keydown',
            (event: KeyboardEvent) => {
                switch (event.key) {
                    case 'Space':
                    case 'Enter':
                        event.preventDefault()
                        this.listbox.clickActive()
                        break;

                    case 'ArrowDown':
                        event.preventDefault();
                        this.listbox.focusOption({ kind: 'FocusNext' })
                        break;

                    case 'ArrowUp':
                        event.preventDefault();
                        this.listbox.focusOption({ kind: 'FocusPrevious' })
                        break;

                    case 'Tab':
                        event.preventDefault();
                        break;

                    case 'Escape':
                        event.preventDefault()
                        this.listbox.toggle()
                        break
                }
            }
        );
    }
}




// LISTBOX OPTION


@Directive({
    selector: '[hlListboxOption]'
})
export class ListboxOptionDirective<T> implements OnInit {
    view!: EmbeddedViewRef<any>
    element!: HTMLElement
    context = { active: false, selected: false };

    @Input()
    hlListboxOptionDisabled: boolean = false;

    @Input()
    hlListboxOptionValue: T | null = null;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainerRef: ViewContainerRef,
        @Host() private listbox: ListboxComponent<any>,
        private renderer: Renderer2) {
        this.listbox.listboxOptions.push(this);
    }

    ngOnInit(): void {
        this.context.selected = this.listbox.isSelected(this.hlListboxOptionValue)
        this.view = this.viewContainerRef.createEmbeddedView(this.templateRef, this.context);
        this.element = this.view.rootNodes[0]
        this.initAttributes(this.element)
        this.initListeners(this.element)
    }

    focus(active: boolean) {
        this.context.active = active;
        this.view.markForCheck();
    }

    select(selected: boolean) {
        this.context.selected = selected;
        this.view.markForCheck();
    }

    private initAttributes(element: HTMLElement) {
        element.id = `headlessui-listbox-option-${generateId()}`
        element.tabIndex = -1;
        element.setAttribute('role', 'listboxoption');
        if (this.hlListboxOptionDisabled) {
            this.element.setAttribute('aria-disabled', 'true')
        } else {
            this.element.removeAttribute('aria-disabled')
        }
    }

    private initListeners(element: HTMLElement) {
        this.renderer.listen(
            element,
            'pointermove',
            () => this.listbox.focusOption({ kind: 'FocusSpecific', option: this })
        );

        this.renderer.listen(
            element,
            'pointerleave',
            () => this.listbox.focusOption({ kind: 'FocusNothing' })
        );

        this.renderer.listen(
            element,
            'click',
            (event) => {
                if (this.hlListboxOptionDisabled) {
                    event.preventDefault()
                    return
                }
                this.listbox.select(this.hlListboxOptionValue)
                this.listbox.toggle()
            }
        );
    }
}


type FocusPrevious = { kind: 'FocusPrevious' }
type FocusNext = { kind: 'FocusNext' }
type FocusNothing = { kind: 'FocusNothing' }
type FocusSpecific<T> = { kind: 'FocusSpecific', option: ListboxOptionDirective<T> }

type FocusType<T> =
    | FocusPrevious
    | FocusNext
    | FocusNothing
    | FocusSpecific<T>



@NgModule({
    imports: [],
    exports: [ListboxComponent, ListboxButtonDirective, ListboxOptionsPanelDirective, ListboxOptionDirective],
    declarations: [ListboxComponent, ListboxButtonDirective, ListboxOptionsPanelDirective, ListboxOptionDirective],
    providers: []
})
export class ListboxModule { }