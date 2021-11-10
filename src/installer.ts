import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as io from '@actions/io';
import getOS from './get-os';
import getArch from './get-arch';
import getURL from './get-url';
import * as path from 'path';
import {Tool, Action} from './constants';
import { getPandocURL } from './get-url';
import {Pandoc} from './constants';
import * as exec from '@actions/exec';
import { showVersion } from './main';
import { writeFileSync } from 'fs';

export function getHomeDir(): string {
  let homedir = '';

  if (process.platform === 'win32') {
    homedir = process.env['USERPROFILE'] || 'C:\\';
  } else {
    homedir = `${process.env.HOME}`;
  }

  core.debug(`homeDir: ${homedir}`);

  return homedir;
}

export async function createWorkDir(): Promise<string> {
  const workDir = path.join(getHomeDir(), Action.WorkDirName);
  await io.mkdirP(workDir);
  core.debug(`workDir: ${workDir}`);
  return workDir;
}

export async function createWorkDirForPandoc(): Promise<string> {
  const workDir = path.join(getHomeDir(), Pandoc.WorkDirName);
  await io.mkdirP(workDir);
  core.debug(`workDir: ${workDir}`);
  return workDir;
}

export async function createTempDir(workDir: string): Promise<string> {
  const tempDir = path.join(workDir, Action.TempDirName);
  await io.mkdirP(tempDir);
  core.debug(`tempDir: ${tempDir}`);
  return tempDir;
}

export async function createBinDir(workDir: string): Promise<string> {
  const binDir = path.join(workDir, 'bin');
  await io.mkdirP(binDir);
  core.addPath(binDir);
  core.debug(`binDir: ${binDir}`);
  return binDir;
}

export async function installHugo(version: string): Promise<void> {
  const extended: string = core.getInput('extended');
  core.debug(`Hugo extended: ${extended}`);

  const osName: string = getOS(process.platform);
  core.debug(`Operating System: ${osName}`);

  const archName: string = getArch(process.arch);
  core.debug(`Processor Architecture: ${archName}`);

  const toolURL: string = getURL(osName, archName, extended, version);
  core.debug(`toolURL: ${toolURL}`);

  const workDir = await createWorkDir();
  const binDir = await createBinDir(workDir);
  const tempDir = await createTempDir(workDir);

  const toolAssets: string = await tc.downloadTool(toolURL);
  let toolBin = '';
  if (process.platform === 'win32') {
    const toolExtractedFolder: string = await tc.extractZip(toolAssets, tempDir);
    toolBin = `${toolExtractedFolder}/${Tool.CmdName}.exe`;
  } else {
    const toolExtractedFolder: string = await tc.extractTar(toolAssets, tempDir);
    toolBin = `${toolExtractedFolder}/${Tool.CmdName}`;
  }
  await io.mv(toolBin, binDir);
}

export async function installPandoc(pandocVersion: string): Promise<void> {
  const toolURL: string = getPandocURL("linux", "amd64",  pandocVersion);
  core.debug(`toolURL: ${toolURL}`);
  const workDir = await createWorkDirForPandoc();
  const binDir = await createBinDir(workDir);
  const tempDir = await createTempDir(workDir);

  const toolAssets: string = await tc.downloadTool(toolURL);
  let toolBin = '';
  if (process.platform === 'win32') {
    const toolExtractedFolder: string = await tc.extractZip(toolAssets, tempDir);
    toolBin = `${toolExtractedFolder}/pandoc-${pandocVersion}/bin/${Pandoc.CmdName}.exe`;
  } else {
    const toolExtractedFolder: string = await tc.extractTar(toolAssets, tempDir);
    toolBin = `${toolExtractedFolder}/pandoc-${pandocVersion}/bin/${Pandoc.CmdName}`;
  }
  const result = await showVersion("pwd", []);
  const working_dir = result.output.trimEnd();
  const pandoc_path =  path.join(working_dir, 'pandoc');
  writeFileSync(`${pandoc_path}`, `#!/bin/bash\nexec ${toolBin} --no-highlight "$@"\n`);
  await exec.exec("chmod", ["+x", "pandoc"]);
  await io.mv("pandoc", binDir);
}
