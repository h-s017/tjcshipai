import json, pathlib, subprocess, sys, unittest
from unittest.mock import patch
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import blogger_archive as archive
import audit_shipai_months as audit

class ArchiveTests(unittest.TestCase):
    def test_existing_posts_preserved(self):
        old = json.loads(subprocess.check_output(['git','show','HEAD:data/bible-posts.json']))['posts']
        new = json.loads(pathlib.Path('data/bible-posts.json').read_text(encoding='utf-8'))['posts']
        indexed = {p['url']:p for p in new}
        self.assertEqual(len(new), len(indexed))
        for p in old: self.assertEqual(indexed[p['url']], p)
        self.assertEqual(sum(p['source']=='如鷹展翅' for p in new),1092)
    def test_failed_fetch_cannot_write_index(self):
        before = audit.INDEX.read_bytes()
        with patch.object(audit,'collect',side_effect=RuntimeError('network failure')), patch.object(audit,'write') as save:
            with self.assertRaises(RuntimeError): audit.main(update=True)
            self.assertTrue(all(str(c.args[0]) != str(audit.INDEX) for c in save.call_args_list))
        self.assertEqual(before,audit.INDEX.read_bytes())
    def test_url_disagreement_blocks_update(self):
        with patch.object(audit,'collect',return_value=({},0)), patch.object(audit,'sitemap',return_value=({'https://example.com/missing.html'},1)), patch.object(audit,'write') as save:
            with self.assertRaises(Exception): audit.main(update=True)
            self.assertTrue(all(str(c.args[0]) != str(audit.INDEX) for c in save.call_args_list))
    def test_cached_collection_is_repeatable(self):
        a,total = archive.collect()
        b,total2 = archive.collect()
        self.assertEqual(a,b)
        self.assertEqual(total,total2)
        self.assertEqual(set(a),archive.sitemap()[0])

if __name__=='__main__': unittest.main()
