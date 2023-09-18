import { ConstructedRoute, HashRouter, PathRouter, Router } from "@acryps/page";

const getActiveURL = (router: Router, path: string) => {
	switch (router.constructor) {
		case HashRouter: return `#${path}`;
		case PathRouter: return path;

		default: return path;
	}
}

export function registerDirectives(Component, router: Router) {
	Component.directives['ui-click'] = (element, value, tag, attributes) => {
		let resolved = true;

		element.onclick = async event => {
			// Prevent click on awaiting button
			if (!resolved) {
				event.stopPropagation();
				return;
			}

			resolved = false;
			element.setAttribute('ui-click-pending', '');

			const text = attributes['ui-click-text'];

			async function resolveClickHandler() {
				try {
					await value(event);
				} catch (error) {
					element.hostingComponent.onerror(error);
				} finally {
					element.removeAttribute('ui-click-pending');
					resolved = true;
				}
			}

			if (text) {
				const originalContent = element.textContent;
				element.textContent = text;
		
				requestAnimationFrame(async () => {
					await resolveClickHandler();
		
					element.textContent = originalContent;
				});
			} else {
				await resolveClickHandler();
			}

			event.stopPropagation();
		}
	};

	Component.directives['ui-focus'] = (element, value) => element.onfocus = event => {
		value(event);
	
		event.stopPropagation();
	};

	Component.directives['ui-href'] = (element, value, tag, attributes) => {
		function createLink() {
			const path = router.absolute(value, element.hostingComponent);
	
			if (tag == 'a') {
				if (attributes['ui-href-target'] == 'blank') {
					element.setAttribute('target', '_blank');
				}

				if (router.getRoute(path)) {
					element.setAttribute('href', getActiveURL(router, path));
				}
			}

			// will be executed before default browser link navigation.
			element.onclick = event => {
				// overwrites href default browser navigation
				event.stopPropagation();
				event.preventDefault();

				if (!router.getRoute(path)) {
					if (attributes['ui-href-target'] == 'blank') {
						open(path);
					} else {
						location.href = path;
					}
					
					return;
				}
			
				if (attributes['ui-href-target'] == 'blank') {
					open(getActiveURL(router, path));
				} else {
					router.navigate(path);
				}
			}
		}

		router.addEventListener('parameterchanged', () => createLink());
	
		createLink();
	};
	
	Component.directives['ui-href-active'] = (element, value, tag, attributes) => {
		function resolveActive() {
			const activeRoute = router.getActiveRoute();
			const elementPath = router.absolute(value === true ? attributes['ui-href'] : value, element.hostingComponent);
			const elementRoute = router.getRoute(elementPath);

			function hasMatch(activeRoute: ConstructedRoute, elementRoute: ConstructedRoute) {
				if (activeRoute.path == elementRoute.path) {
					return true;
				} else if (activeRoute.parent) {
					return hasMatch(activeRoute.parent, elementRoute);
				} else {
					return false;
				}
			}

			if (hasMatch(activeRoute, elementRoute) && router.getActivePath().startsWith(elementPath)) {
				element.setAttribute('ui-active', '');
			} else {
				element.removeAttribute('ui-active');
			}
		}

		router.addEventListener('parameterchanged', () => resolveActive());
	
		resolveActive();
	};
	
	Component.directives['id'] = (element, value, tag) => {
		if (value[0] == '.') {
			element.hostingComponent[value.substring(1)] = element;
		} else {
			element.id = value;
		}
	};
	
	Component.directives['ui-value'] = (element, value, tag) => {
		if (tag == 'option') {
			(element as any).dataValue = value;
			element.value = Math.random().toString(16).substring(2);
	
			return;
		}
	
		throw 'use [$ui-value]'
	};
	
	Component.directives['$ui-value'] = (element, accessor, tag, attributes, content) => {
		if (tag == 'option') {
			throw 'use [ui-value]';
		}
	
		if (attributes.type == 'checkbox') {
			element.checked = accessor.get();
	
			element.onchange = () => {
				accessor.set(element.checked);
	
				attributes['ui-change'] && attributes['ui-change'](element.checked);
			};
		} else if (attributes.type == 'date') {
			element.type = 'date';
			element.valueAsDate = accessor.get();
	
			element.onchange = () => {
				accessor.set(element.valueAsDate);
	
				attributes['ui-change'] && attributes['ui-change'](element.valueAsDate);
			};
		} else if (attributes.type == 'datetime-local') {
			element.type = 'datetime-local';

			const date = accessor.get();

			if (date) {
				element.value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
			}
	
			element.onchange = () => {
				const value = new Date(element.value);
				accessor.set(value);
	
				attributes['ui-change'] && attributes['ui-change'](value);
			};
		} else if (attributes.type == 'file') {
			element.type = 'file';
			element.files = accessor.get();
	
			element.onchange = () => {
				accessor.set(element.files);
	
				attributes['ui-change'] && attributes['ui-change'](element.files);
			};
		} else if (tag == 'select') {
			content = content.flat();
	
			const initialValue = accessor.get();
			element.value = content.find(element => element.dataValue == initialValue || ((typeof element.dataValue == 'object' && element.dataValue) && (typeof initialValue == 'object' && initialValue) && ('id' in element.dataValue) && ('id' in initialValue) && element.dataValue?.id == initialValue?.id))?.value;

			element.onchange = () => {
				const findOption = options => {
					for (let option of options) {
						if (option.value == element.value) {
							return option;
						} else if (option.children?.length) {
							return findOption(option.children);
						}
					}
				}
				
				const option = findOption(content);
	
				accessor.set(option.dataValue);
	
				attributes['ui-change'] && attributes['ui-change'](option.dataValue);
			};
		} else if (attributes.type == 'number') {
			element.value = accessor.get();
			
			element.onblur = () => {
				accessor.set(+element.value);
				
				attributes['ui-change'] && attributes['ui-change'](+element.value);
			};
		} else {
			element.value = accessor.get() ?? '';
			
			element.onblur = () => {
				accessor.set(element.value);
				
				attributes['ui-change'] && attributes['ui-change'](element.value);
			};
		}
	};	
}