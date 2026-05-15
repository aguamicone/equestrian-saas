# Migrating to React Native (Expo)

This guide outlines the steps to port the **Equestrian SaaS** web prototype to a native mobile application using **Expo (React Native)**.

## Phase 1: Setup
1. Initialize a new Expo project.
   ```bash
   npx create-expo-app equestrian-mobile
   ```
2. Install dependencies similar to the web project:
   ```bash
   npx expo install expo-router react-native-safe-area-context lucide-react-native clsx tailwind-merge
   ```
   *(Note: For Tailwind in RN, use `nativewind`)*

## Phase 2: Logic Porting
Good news! The heavy lifting is already done in `src/context`. The Logic is **Platform Agnostic**.
- Copy `src/context/AuthContext.jsx` -> `app/context/AuthContext.tsx`.
- Copy `src/context/DataContext.jsx` -> `app/context/DataContext.tsx`.
- **Adaptation Needed**: `localStorage` does not exist in Native. Replace it with `AsyncStorage` from `@react-native-async-storage/async-storage`.

## Phase 3: UI Replacement
You cannot use HTML tags (`<div>`, `<p>`, `<img>`) in React Native. You must replace them with Native components:

| Web | React Native |
|-----|--------------|
| `div` | `View` |
| `p`, `h1`, `span` | `Text` |
| `button` | `Pressable` or `TouchableOpacity` |
| `img` | `Image` |
| `input` | `TextInput` |
| `ul`/`li` | `FlatList` |

### Example: Component Migration

**Web (React)**
```jsx
<div className="bg-slate-800 p-4 rounded">
  <h2 className="text-white">Title</h2>
</div>
```

**Mobile (React Native + NativeWind)**
```jsx
<View className="bg-slate-800 p-4 rounded-lg">
  <Text className="text-white text-xl font-bold">Title</Text>
</View>
```

## Phase 4: Navigation
Replace `react-router-dom` with `expo-router`.
- File structure determines routes (similar to Next.js).
- `app/index.js` -> Login Screen.
- `app/(tabs)/_layout.js` -> Bottom Tabs (Client/Staff Dashboards).

## Recommended Strategy
Start by building the **Staff App** first. It requires Camera (Photo Evidence) and Location (GPS for tasks), which are much more powerful in Native than on Web.
