---
title: Scriptable
---

# Scriptable

<script setup>
import {config} from './scriptable';
</script>

<Chart
  :type="config.type"
  :options="config.options"
  :data="config.data"
/>

### Code

:::code-group

<<< ./scriptable.ts#config [config]

<<< ./scriptable.ts#data [data]

:::
