# @spfxappdev/sortable

[![npm version](https://badge.fury.io/js/%40spfxappdev%2Fsortable.svg)](https://www.npmjs.com/package/@spfxappdev/sortable)

A lightweight and customizable React sortable list component.  This component allows you to create sortable lists where users can drag and drop items within a single list (sort), or move items between multiple lists.  It's designed to be flexible and give you full control over the behavior and appearance.  This package does **not** include any CSS, giving you complete freedom to style it as you wish.

## Key Features

*   **Single and Multiple List Sorting:**  Sort items within a single list or move/copy them between connected lists.
*   **Customizable Drag Handles:**  Define specific elements within list items as drag handles.
*   **Flexible Interaction Modes:** Control whether items are moved, cloned, or if a custom action is performed when dragged between lists.
*   **Full TypeScript Support:**  Built with TypeScript for excellent type safety and developer experience.
*   **Small:**  A lightweight component with minimal overhead and zero dependencies (except React, of course).
*   **No CSS Included:**  Complete styling freedom. You provide the CSS.

## Installation

```bash
npm install @spfxappdev/sortable
```

## Usage Example

```typescript jsx
import React, { useState } from "react";
import {
  Sortable,
  SharedListMode,
  ISortableProps,
  ISortableSharedListProps,
} from "@spfxappdev/sortable";

interface Item {
  id: number;
  text: string;
}

const App: React.FC = () => {
  const [items1, setItems1] = useState<Item[]>([
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
    { id: 3, text: "Item 3" },
  ]);

  const [items2, setItems2] = useState<Item[]>([
    { id: 4, text: "Item 4" },
    { id: 5, text: "Item 5" },
  ]);

  const sharedProps: ISortableSharedListProps[] = [
    { name: "sharedGroup", mode: SharedListMode.Move },
  ];

  const handleOnChange = (
    items: Item[],
    changedItem?: Item,
    oldIndex?: number,
    newIndex?: number
  ) => {
    // Update your state here.  This example assumes you know which list changed.
    // In a real app, you'd likely need to identify the list.

    setItems1([...items]);
  };

  const handleOnChange2 = (
    items: Item[],
    changedItem?: Item,
    oldIndex?: number,
    newIndex?: number
  ) => {
    // Update your state here.  This example assumes you know which list changed.
    // In a real app, you'd likely need to identify the list.

    setItems2([...items]);
  };

  return (
    <div>
      <Sortable
        items={items1}
        sharedListProps={sharedProps}
        onChange={handleOnChange}
        handle=".drag-handle"
        visualizationCssClasses={{
          target: "sortable-visual-target", //optional
          top: "sortable-visual-above", //optional
          bottom: "sortable-visual-below", //optional
        }}
      >
        {items1.map((item: Item): JSX.Element => {
          return (
            <div key={item.id} className="list-item">
              {/* Example of a drag handle */}
              <span className="drag-handle">|||</span>
              {item.text}
            </div>
          );
        })}
      </Sortable>

      <h2>List 2</h2>
      <Sortable
        items={items2}
        onChange={handleOnChange2}
        sharedListProps={sharedProps}
        visualizationCssClasses={{
          target: "sortable-visual-target", //optional
          top: "sortable-visual-above", //optional
          bottom: "sortable-visual-below", //optional
        }}
      >
        {items2.map((item: Item): JSX.Element => {
          return (
            <div key={item.id} className="list-item">
              {item.text}
            </div>
          );
        })}
      </Sortable>
    </div>
  );
};

export default App;


```

```css
/* Example CSS (You MUST provide your own CSS) */
.list-item {
  padding: 10px;
  border: 1px solid #ccc;
  margin-bottom: 5px;
  background-color: #f9f9f9;
}

.drag-handle {
  cursor: grab;
  margin-right: 5px;
}
/*Visualisation classes */

.sortable-visual-target.sortable-visual-above {
  border-top: 2px solid blue;
}

.sortable-visual-target.sortable-visual-below {
  border-bottom: 2px solid blue;
}
```

## API Reference (Props)

The `Sortable` component accepts the following props:

| Prop Name              | Type                                                                  | Description                                                                                                                                                                                                                                                           | Default    |
| ---------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `name`                  | `string`                                                              | The sortable list name.  This is important if using `sharedListProps`                                                                                                                                                                                                                          | Random `string`    |
| `tag`                  | `string`                                                              | The HTML tag for the container element.                                                                                                                                                                                                                           | `'div'`    |
| `containerProps`       | `React.HTMLAttributes<HTMLElement>`                                   | Standard HTML attributes (like `className`, `style`, etc.) to apply to the container.                                                                                                                                                                                   |            |
| `sort`                 | `boolean`                                                             | Enables or disables sorting within the list.                                                                                                                                                                                                                         | `true`     |
| `handle`               | `string`                                                              | A CSS selector for elements *within* list items that act as drag handles. If omitted, the entire list item is draggable.  The handle *must* be a descendant of a list item.                                                                                       |            |
| `sharedListProps`      | `ISortableSharedListProps[]`                                           | Configures how this list interacts with other `Sortable` lists.  See below for details.                                                                                                                                                              |            |
| `onDragEnd`            | `(event: any, draggedItem: Element, targetItem?: Element) => void`   | Callback function called when a drag operation ends.                                                                                                                                                                                                                |            |
| `items`                | `any[]`                                                               | An array of data corresponding to the list items.  Essential for cloning between lists and maintaining correct order.                                                                                                                                                  |            |
| `visualizationCssClasses` | `Partial<IVisualizationCssClasses>`                                  | Optional CSS classes to customize the visual appearance during dragging. You must provide the CSS for these classes. See below for details.          |  `{top: "above-drop-target", bottom: "below-drop-target", target: "drop-target",}`    |
| `onChange`             | `(items: any[], changedItem?: any, oldIndex?: number, newIndex?: number) => void` | Callback function called when the item order changes. Use this to update your application's state.                                                                                                                                                              |           |

### `ISortableSharedListProps`

| Property | Type              | Description                                                                                                                   | Default      |
| -------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `name`   | `string`          | Identifies which `Sortable` lists can interact. Only lists with the *same* `name` can exchange items.                        |              |
| `mode`   | `SharedListMode` | Determines what happens when an item is dragged *to* this list. The *target* list's `mode` controls the behavior. | `Move`       |

```typescript
enum SharedListMode {
    Move,   // Move the item between lists
    Clone,  // Create a copy of the item in the target list
    None,   // Prevent moving items to this list
    Custom, // Use a custom function to handle the interaction (advanced)
}
```

### `IVisualizationCssClasses`

| Property | Type     | Description                                               | Default |
| -------- | -------- | --------------------------------------------------------- | ------- |
| `top`    | `string` | CSS class applied to the element above the drop target.    | `above-drop-target` |
| `bottom` | `string` | CSS class applied to the element below the drop target.    | `below-drop-target` |
| `target` | `string` | CSS class applied to the drop target element itself.       | `drop-target` |

## Styling

You are responsible for providing the CSS for your sortable lists.  This gives you maximum flexibility.  You **must** define styles for the visual feedback classes if you use them (e.g., `above-drop-target`, `below-drop-target`, `drop-target` or your custom names if you provided alternative class names in `visualizationCssClasses`).

The example above shows basic styling using borders.  You can use any CSS techniques you like (e.g., background colors, borders) to create the desired visual effect (on target element).

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss any changes.
