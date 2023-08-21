# default directives for @acryps/page
provides basic directives for @acryps/page projects

Usage: Call `registerDirectives(Component, router)` in your apps main, before using `router.host(...)`. 

Then use the directives in your components: 
```
<ui-button ui-click={() => console.log("clicked!")}>
    Click Me!
</ui-button>

<input $ui-value={this.somevariable} ui-change={() => console.log("set:", this.somevariable)}></input>
```

## Directives
`ui-click`: Sets `onclick` handler and calls value when the element is clicked<br>
`ui-focus`: Attaches to `onfocus` and calls value when the element is focused

`ui-href`: Uses `component.navigate` to navigate relative to the current component. Will open native links too, if the route is not found<br>
`ui-href-target="blank"`: Opens the `ui-href` links in a new tab/window<br>
`ui-href-active`: Sets `ui-active` attribute on page navigation (hashchange)

`$ui-value`: Gets/Sets variable based on input/textarea value.<br>
`ui-value`: Defines a object value for a `<option>` in a `<select>`.<br>
`ui-change`: Will be called when an inputs value changes (only when `$ui-value` is used)

`id`: Sets the elements id. Will set `test` property of your component to this element if you use `.test` as the ids value. (Deprecated, use `{this.test = <ui-test></ui-test>}` instead)